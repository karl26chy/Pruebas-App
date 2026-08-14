import type { Grade, User } from '../types';

/** Edad cumplida a día de hoy; 0 si no hay fecha de nacimiento registrada. */
export function getAge(fechaNacimiento?: string): number {
  if (!fechaNacimiento) return 0;

  const birth = new Date(fechaNacimiento);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const fullName = (user?: Pick<User, 'nombre' | 'apellido'> | null): string =>
  user ? `${user.nombre} ${user.apellido}` : '';

export const initials = (user: Pick<User, 'nombre' | 'apellido'>): string =>
  `${user.nombre[0] ?? ''}${user.apellido[0] ?? ''}`;

/** Etiqueta legible de un grado: 6to "A". */
export const gradeLabel = (grade?: Grade | null): string =>
  grade ? `${grade.nombre} "${grade.tipo_grado}"` : '';

/** Nombre de archivo seguro a partir del nombre de una persona. */
export const fileSlug = (user: Pick<User, 'nombre' | 'apellido'>): string =>
  `${user.nombre}_${user.apellido}`
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
