import { validateMark } from './marks.validator.js';
import { validateUser } from './users.validator.js';

/** Un validador por recurso; los que no aparecen no tienen reglas propias. */
const validatorByResource = {
  marks: validateMark,
  users: validateUser,
};

export async function validateRow(resource, data, existingRow) {
  const validate = validatorByResource[resource];
  if (validate) await validate(data, existingRow);
}
