/**
 * Catálogo oficial de tipos de documento.
 * En la BD se guarda el código (CC, TI, ...); estas etiquetas son la
 * representación para mostrar al usuario.
 */
export const DOCUMENT_TYPES: Record<string, string> = {
  CC: 'Cédula de ciudadanía',
  TI: 'Tarjeta de identidad',
  CE: 'Cédula de extranjería',
  PA: 'Pasaporte',
  PPT: 'Permiso por Protección Temporal',
};

/** Etiqueta de un tipo de documento, o "No especificado" si no existe. */
export const documentTypeLabel = (tipo?: string | null): string =>
  (tipo && DOCUMENT_TYPES[tipo]) || 'No especificado';

/** "Tarjeta de identidad — 123456789" o "No especificado — 123456789". */
export const documentoCompleto = (tipo?: string | null, numero?: string | null): string => {
  const numeroMostrado = numero || 'N/R';
  return `${documentTypeLabel(tipo)} — ${numeroMostrado}`;
};
