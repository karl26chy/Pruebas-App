import { getTemplate } from './templates/registry.js';

/**
 * Genera el .tex completo de un boletín a partir de AcademicReportData y la
 * configuración de la institución. No consulta la BD ni calcula nada: solo
 * delega en la plantilla seleccionada por `institution.reportConfig.template`.
 */
export function renderTeX(data, config, ctx = {}) {
  const name = data.institution?.reportConfig?.template;
  const template = getTemplate(name);
  return template(data, config, ctx);
}
