import { HttpError } from '../shared/http-error.js';
import { periodById, findRaw } from '../repositories/resource.repository.js';
import * as repo from '../repositories/report.repository.js';

/**
 * Reporte académico individual por período.
 *
 * Autorización (backend es la autoridad):
 *  · solo el rol ADMIN de la institución;
 *  · el estudiante debe pertenecer a la institución del admin;
 *  · el período debe pertenecer a la institución del admin.
 *
 * Todos los datos (notas, evaluaciones, asistencia) se filtran por el período
 * solicitado. Los períodos cerrados/históricos siguen siendo consultables: el
 * reporte se reconstruye del historial almacenado, no se borra nada al cerrar.
 */

/** Promedio ponderado Σ(nota × porcentaje) / Σ(porcentaje); si no hay
 *  porcentajes, cae al promedio aritmético (misma regla que lib/grades.ts). */
function weightedAverage(marks) {
  if (marks.length === 0) return 0;
  const totalWeighted = marks.reduce((acc, m) => acc + m.nota * (m.porcentaje || 0), 0);
  const totalWeight = marks.reduce((acc, m) => acc + (m.porcentaje || 0), 0);
  const avg =
    totalWeight > 0
      ? totalWeighted / totalWeight
      : marks.reduce((acc, m) => acc + m.nota, 0) / marks.length;
  return Number(avg.toFixed(2));
}

function edadDesde(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const match = String(fechaNacimiento).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const nac = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export async function getReport(user, studentId, periodId) {
  if (!user) throw new HttpError(401, 'No autorizado. Inicia sesión.');
  if (user.rol !== 'admin') {
    throw new HttpError(403, 'Solo el administrador de la institución puede generar boletines.');
  }
  if (!periodId) throw new HttpError(400, 'Falta period_id.');

  const student = await repo.studentForReport(studentId);
  if (!student || student.institucion_id !== user.institucion_id) {
    // No filtrar si el estudiante existe: respuesta genérica.
    throw new HttpError(404, 'Estudiante no encontrado.');
  }

  const period = await periodById(periodId);
  if (!period || period.institucion_id !== user.institucion_id) {
    throw new HttpError(404, 'Período académico no encontrado.');
  }

  const institution = await findRaw('institutions', user.institucion_id);
  const config = await repo.reportConfigFor(user.institucion_id);
  const grade = await repo.gradeOfStudent(studentId);

  const escalaMaxima = Number(institution?.escala_maxima ?? (institution?.tipo === 'universidad' ? 5 : 10));
  const notaMinima = Number(institution?.nota_minima_aprobacion ?? Math.round(escalaMaxima * 0.6));

  const subjects = [];
  let allMarks = [];
  if (grade) {
    const assignments = await repo.assignmentsOfGrade(grade.id);
    allMarks = await repo.marksOfStudentPeriod(studentId, periodId);
    const allEvals = await repo.evaluationsOfPeriod(user.institucion_id, grade.id, periodId);

    for (const assign of assignments) {
      const evals = allEvals.filter(e => e.materia_id === assign.materia_id);
      const subjectMarks = allMarks.filter(m => m.materia_id === assign.materia_id);
      const promedio = weightedAverage(
        subjectMarks.map(m => ({ nota: Number(m.nota), porcentaje: Number(m.porcentaje) }))
      );
      const estado =
        evals.length === 0 || subjectMarks.length === 0
          ? 'Sin notas'
          : promedio >= notaMinima
            ? 'Aprobado'
            : 'Reprobado';

      subjects.push({
        materia_id: assign.materia_id,
        materia: assign.materia || 'Materia',
        docente:
          [assign.docente_nombre, assign.docente_apellido].filter(Boolean).join(' ') || null,
        evaluaciones: evals.map(ev => ({
          evaluacion_id: ev.id,
          nombre: ev.nombre,
          porcentaje: ev.porcentaje !== null ? Number(ev.porcentaje) : null,
          fecha: ev.fecha_evaluacion || null,
          nota: (() => {
            const mark = subjectMarks.find(m => m.evaluacion_id === ev.id);
            return mark ? Number(mark.nota) : null;
          })(),
        })),
        promedio,
        estado,
      });
    }
  } else {
    allMarks = await repo.marksOfStudentPeriod(studentId, periodId);
  }

  const attendanceRows = await repo.attendanceOfStudentPeriod(studentId, periodId);
  const presente = attendanceRows.filter(a => a.estado === 'presente').length;
  const ausente = attendanceRows.filter(a => a.estado === 'ausente').length;
  const justificada = attendanceRows.filter(a => a.estado === 'justificada').length;
  const total = attendanceRows.length;
  const tasa = total === 0 ? 0 : Math.round((presente / total) * 100);

  const promedioGeneral = weightedAverage(
    allMarks.map(m => ({ nota: Number(m.nota), porcentaje: Number(m.porcentaje) }))
  );
  const estadoGlobal =
    allMarks.length === 0 ? 'Sin notas' : promedioGeneral >= notaMinima ? 'Aprobado' : 'Reprobado';

  return {
    student: {
      id: student.id,
      nombre: student.nombre,
      apellido: student.apellido,
      identificacion: student.identificacion ?? null,
      tipo_documento: student.tipo_documento ?? null,
      edad: edadDesde(student.fecha_nacimiento),
      genero: student.genero ?? null,
    },
    institution: {
      id: institution.id,
      nombre: institution.nombre,
      tipo: institution.tipo,
      escala_maxima: escalaMaxima,
      nota_minima_aprobacion: notaMinima,
      reportConfig: config
        ? {
            template: (config.config && config.config.template) || 'default',
            logo_url: config.logo_url || null,
            config: config.config || {},
          }
        : null,
    },
    period: {
      id: period.id,
      numero: period.numero,
      nombre: period.nombre,
      anio: period.anio,
      fecha_inicio: period.fecha_inicio || null,
      fecha_fin: period.fecha_fin || null,
      activo: period.activo,
    },
    grade: grade ? { id: grade.id, nombre: grade.nombre, tipo_grado: grade.tipo_grado } : null,
    subjects,
    attendance: { presente, ausente, justificada, total, tasa },
    summary: {
      promedioGeneral,
      estadoGlobal,
      escalaMaxima,
      notaMinimaAprobacion: notaMinima,
    },
  };
}
