import { HttpError } from '../shared/http-error.js';
import { periodById, periodOfInstitutionByNameAndYear } from '../repositories/resource.repository.js';

/**
 * Reglas de evaluaciones:
 *  · si se indica un periodo_id, debe existir, pertenecer a la institución de
 *    la evaluación y estar abierto (activo);
 *  · si se indica solo el texto del periodo, se vincula por (institución,
 *    nombre, año); sin match no se inventa una asociación.
 */
export async function validateEvaluation(data, existingRow) {
  const institucionId = data.institucion_id ?? existingRow?.institucion_id;
  if (!institucionId) throw new HttpError(400, 'Falta institucion_id.');

  const periodoId = data.periodo_id ?? existingRow?.periodo_id;
  let periodo = null;

  if (periodoId) {
    periodo = await periodById(periodoId);
    if (!periodo) throw new HttpError(400, 'El periodo no existe.');
    if (String(periodo.institucion_id) !== String(institucionId)) {
      throw new HttpError(403, 'El periodo no pertenece a esta institución.');
    }
  } else if (data.periodo) {
    const anio = data.anio ?? existingRow?.anio;
    if (anio) {
      periodo = await periodOfInstitutionByNameAndYear(institucionId, data.periodo, Number(anio));
      if (!periodo) throw new HttpError(400, 'No se encontró un periodo que coincida con el periodo indicado.');
      data.periodo_id = periodo.id;
    }
  }

  if (periodo && periodo.activo === false) {
    throw new HttpError(409, 'El periodo está cerrado; no se pueden crear o modificar evaluaciones.');
  }
}
