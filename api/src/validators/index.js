import { validateMark } from './marks.validator.js';
import { validateUser } from './users.validator.js';
import { validateStudentGrade } from './student_grades.validator.js';
import { validateEvaluation } from './evaluations.validator.js';

/** Un validador por recurso; los que no aparecen no tienen reglas propias. */
const validatorByResource = {
  marks: validateMark,
  users: validateUser,
  student_grades: validateStudentGrade,
  evaluations: validateEvaluation,
};

export async function validateRow(resource, data, existingRow) {
  const validate = validatorByResource[resource];
  if (validate) await validate(data, existingRow);
}
