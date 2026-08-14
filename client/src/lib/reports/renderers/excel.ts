import * as XLSX from 'xlsx';
import type { AcademicReportData, ReportConfig } from '../types';
import { mergeConfig, reportFileName } from '../template';

/** Plantilla DEFAULT del boletín en Excel. Consume AcademicReportData (la
 *  misma fuente que el PDF: los datos son idénticos). */
export function renderBoletinExcel(data: AcademicReportData, config: ReportConfig | null) {
  const opts = mergeConfig(config);
  const gradeLabel = data.grade ? `${data.grade.nombre} "${data.grade.tipo_grado}"` : 'Sin asignar';
  const periodLabel = `${data.period.numero} — ${data.period.nombre} — ${data.period.anio}`;

  const aoa: (string | number)[][] = [
    [`Boletín de Calificaciones - ${data.institution.nombre}`],
    [`Período: ${periodLabel}`],
    [],
    ['Estudiante', `${data.student.nombre} ${data.student.apellido}`],
    ['Documento', `${data.student.tipo_documento || ''} ${data.student.identificacion || ''}`],
    ['Grado', gradeLabel],
    ['Género', data.student.genero || 'N/E'],
    ['Edad', data.student.edad ?? '—'],
    [],
    ['Materia', 'Docente', 'Evaluaciones', 'Promedio', 'Estado'],
    ...data.subjects.map(s => [
      s.materia,
      opts.showTeacher ? (s.docente || '—') : '—',
      s.evaluaciones.length,
      s.promedio,
      s.estado,
    ]),
  ];

  if (opts.showEvaluations) {
    aoa.push([], ['Detalle de Evaluaciones'], ['Materia', 'Evaluación', '%', 'Nota']);
    for (const s of data.subjects) {
      for (const ev of s.evaluaciones) {
        aoa.push([s.materia, ev.nombre, ev.porcentaje ?? '—', ev.nota ?? '—']);
      }
    }
  }

  aoa.push(
    [],
    ['Promedio General', data.summary.promedioGeneral],
    ['Estado', data.summary.estadoGlobal],
    ['Escala de calificación', `0 - ${data.summary.escalaMaxima}`],
    ['Nota mínima de aprobación', data.summary.notaMinimaAprobacion],
    [],
    ['Asistencia'],
    ['Presente', data.attendance.presente],
    ['Ausente', data.attendance.ausente],
    ['Inasist. justificadas', data.attendance.justificada],
    ['Total', data.attendance.total],
    ['Tasa (%)', data.attendance.tasa],
  );

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Boletín');
  XLSX.writeFile(wb, reportFileName(data, 'xlsx'));
}
