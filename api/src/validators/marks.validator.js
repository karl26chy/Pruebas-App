import { HttpError } from '../shared/http-error.js';
import { gradingScaleFor, evaluationById, periodById } from '../repositories/resource.repository.js';

/** Nota máxima según el tipo de institución: 0-5 universidad, 0-10 colegio. */
const NOTA_MAXIMA = { universidad: 5, colegio: 10 };
const notaMaximaPara = (tipo) => NOTA_MAXIMA[tipo] ?? NOTA_MAXIMA.colegio;

export async function validateMark(data, existingRow) {
  if (!data.evaluacion_id && !existingRow?.evaluacion_id) {
    throw new HttpError(400, 'La evaluación es obligatoria para registrar notas.');
  }

  if (data.nota !== undefined) {
    if (typeof data.nota !== 'number' || Number.isNaN(data.nota)) {
      throw new HttpError(400, 'La nota debe ser un número.');
    }

    const gradeId = data.grado_id ?? existingRow?.grado_id;
    if (!gradeId) throw new HttpError(400, 'Falta grado_id.');

    const tipo = await gradingScaleFor(gradeId);
    if (!tipo) throw new HttpError(400, 'Grado no encontrado.');

    const max = notaMaximaPara(tipo);
    if (data.nota < 0 || data.nota > max) {
      throw new HttpError(400, `La nota debe estar entre 0 y ${max}.`);
    }
  }

  if (data.porcentaje !== undefined) {
    const invalido =
      typeof data.porcentaje !== 'number' ||
      Number.isNaN(data.porcentaje) ||
      data.porcentaje < 0 ||
      data.porcentaje > 100;
    if (invalido) throw new HttpError(400, 'El porcentaje debe estar entre 0 y 100.');
  }

  // La evaluación es la fuente principal del contexto académico de la nota:
  // periodo_id, periodo y año se toman de la evaluación, no del cuerpo.
  const evaluacionId = data.evaluacion_id ?? existingRow?.evaluacion_id;
  if (evaluacionId) {
    const evaluacion = await evaluationById(evaluacionId);
    if (!evaluacion) throw new HttpError(400, 'La evaluación no existe.');

    data.periodo_id = evaluacion.periodo_id ?? null;
    data.periodo = evaluacion.periodo ?? data.periodo;
    if (evaluacion.anio) data.anio = evaluacion.anio;

    if (evaluacion.periodo_id) {
      const periodo = await periodById(evaluacion.periodo_id);
      if (!periodo) throw new HttpError(400, 'El periodo de la evaluación no existe.');
      if (periodo.activo === false) {
        throw new HttpError(409, 'El periodo está cerrado; no se pueden registrar o modificar notas.');
      }
    }
  }
}
