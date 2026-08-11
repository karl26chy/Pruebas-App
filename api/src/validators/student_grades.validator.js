import { HttpError } from '../shared/http-error.js';
import { studentGradeOf } from '../repositories/resource.repository.js';

/**
 * Reglas de matrícula: un estudiante no puede estar matriculado dos veces
 * en el mismo grado.
 */
export async function validateStudentGrade(data, existingRow) {
  const estudianteId = data.estudiante_id ?? existingRow?.estudiante_id;
  const gradoId = data.grado_id ?? existingRow?.grado_id;
  if (!estudianteId || !gradoId) {
    throw new HttpError(400, 'Faltan datos de la matrícula.');
  }

  // Duplicado: no puede existir otra matrícula del mismo estudiante.
  const actual = await studentGradeOf(estudianteId);
  if (actual && actual.id !== existingRow?.id && actual.grado_id === gradoId) {
    throw new HttpError(409, 'El estudiante ya está matriculado en este grado.');
  }
}
