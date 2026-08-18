import type { AcademicYearReportData, ReportConfig } from './types';
import type { ReportTemplate } from './template';
import { renderBoletinPDF } from './renderers/pdf';
import { renderBoletinExcel } from './renderers/excel';
import { renderLiceoPDF, renderLiceoExcel } from './renderers/liceo';

/**
 * Registro de plantillas por institución. El `institution.reportConfig.template`
 * del reporte selecciona la plantilla; si no existe o no hay configuración,
 * se usa la "default".
 *
 * ── REGLA ARQUITECTÓNICA: UN TEMPLATE = UNA UNIDAD COMPLETA DE DISEÑO ──────
 * La institución SOLO guarda el ID del template en
 * `institution_report_configs.config.template`. Ese ID (p.ej.
 * "liceo_alegre_juventud") resuelve el MISMO diseño en frontend y backend:
 *   · PDF backend  → api/src/services/pdf/latex/templates/<id>/index.js
 *   · PDF frontend → client/src/lib/reports/renderers/<id>.ts (si aplica)
 *   · Excel        → client/src/lib/reports/renderers/<id>.ts
 * La selección NUNCA depende del nombre de la institución ni de condiciones
 * dispersas; solo del template ID.
 *
 * Para agregar un nuevo formato (p.ej. "colegio_nuevo"):
 *   1. Crear su renderer en `client/src/lib/reports/renderers/colegio_nuevo.ts`
 *      (unidad completa: identidad visual, PDF y Excel).
 *   2. Registrar aquí el mismo ID (sin `if institucion === …`).
 *   3. Registrar el MISMO ID en el backend
 *      (`api/src/services/pdf/latex/templates/registry.js`) y, si aplica, en el
 *      catálogo de respaldo (`client/src/lib/reports/template-metadata.ts`).
 * Al actualizar un template, TODAS las instituciones con ese ID reciben el
 * nuevo diseño automáticamente (no hay copias por institución).
 * ────────────────────────────────────────────────────────────────────────────
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
