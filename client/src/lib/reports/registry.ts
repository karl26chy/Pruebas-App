import type { AcademicYearReportData, ReportConfig } from './types';
import type { ReportTemplate } from './template';
import { renderBoletinPDF } from './renderers/pdf';
import { renderBoletinExcel } from './renderers/excel';
import { renderLiceoPDF, renderLiceoExcel } from './renderers/liceo';

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
  liceo_alegre_juventud: {
    name: 'liceo_alegre_juventud',
    renderPDF: renderLiceoPDF,
    renderExcel: renderLiceoExcel,
  },
};

export function getTemplate(data: AcademicYearReportData): ReportTemplate {
  const name = data.institution.reportConfig?.template || 'default';
  return templates[name] || templates.default;
}

export function resolveConfig(data: AcademicYearReportData): ReportConfig | null {
  return data.institution.reportConfig;
}

/** Permite registrar la plantilla de una institución sin tocar el motor. */
export function registerTemplate(template: ReportTemplate): void {
  templates[template.name] = template;
}

export const availableTemplates = () => Object.keys(templates);
