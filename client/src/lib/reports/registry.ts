import type { AcademicReportData, ReportConfig } from './types';
import type { ReportTemplate } from './template';
import { renderBoletinPDF } from './renderers/pdf';
import { renderBoletinExcel } from './renderers/excel';

/**
 * Registro de plantillas por institución. El `institution.reportConfig.template`
 * del reporte selecciona la plantilla; si no existe o no hay configuración,
 * se usa la "default".
 */
const templates: Record<string, ReportTemplate> = {
  default: {
    name: 'default',
    renderPDF: renderBoletinPDF,
    renderExcel: renderBoletinExcel,
  },
};

export function getTemplate(data: AcademicReportData): ReportTemplate {
  const name = data.institution.reportConfig?.template || 'default';
  return templates[name] || templates.default;
}

export function resolveConfig(data: AcademicReportData): ReportConfig | null {
  return data.institution.reportConfig;
}

/** Permite registrar la plantilla de una institución sin tocar el motor. */
export function registerTemplate(template: ReportTemplate): void {
  templates[template.name] = template;
}

export const availableTemplates = () => Object.keys(templates);
