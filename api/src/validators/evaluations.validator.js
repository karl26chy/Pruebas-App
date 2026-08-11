import { HttpError } from '../shared/http-error.js';
import {
  periodById,
  periodOfInstitutionByNameAndYear,
  openPeriodsOfInstitution,
} from '../repositories/resource.repository.js';

/**
 * Reglas de evaluaciones:
 *  · si se indica un periodo_id, debe existir, pertenecer a la institución de
 *    la evaluación y estar abierto (activo);
 *  · si no llega periodo_id pero llega el texto del periodo con su año, se
 *    intenta vincular por (institución, nombre, año);
 *  · si nada de eso lo resuelve, se asigna automáticamente el ÚNICO periodo
 *    abierto de la institución: con 0 abiertos → 409; con varios abiertos
 *    (configuración antigua/inconsistente) → 409 sin elegir arbitrariamente.
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
  } else {
    const anio = data.anio ?? existingRow?.anio;
    if (data.periodo && anio) {
      periodo = await periodOfInstitutionByNameAndYear(institucionId, data.periodo, Number(anio));
    }
    if (!periodo) {
      const abiertos = await openPeriodsOfInstitution(institucionId);
      if (abiertos.length === 0) {
        throw new HttpError(409, 'No hay un periodo académico abierto para esta institución.');
      }
      if (abiertos.length > 1) {
        throw new HttpError(409, 'Hay más de un periodo académico abierto; revisa la configuración de periodos.');
      }
      periodo = abiertos[0];
    }
    data.periodo_id = periodo.id;
    data.periodo = periodo.nombre;
    data.anio = String(periodo.anio);
  }

  if (periodo && periodo.activo === false) {
    throw new HttpError(409, 'El periodo está cerrado; no se pueden crear o modificar evaluaciones.');
  }
}
