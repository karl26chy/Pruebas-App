import { renderDefaultBoletin } from './default/index.js';
import { renderLiceoBoletin } from './liceo/index.js';

/**
 * Registro de plantillas LaTeX por institución. La selección depende de
 * `institution.reportConfig.template`; si no existe o es desconocida, se usa
 * la plantilla "default". Cada plantilla es un módulo independiente que solo
 * recibe datos ya calculados + configuración visual (sin BD, sin cálculos).
 *
 * El registro de plantillas es la ÚNICA fuente de verdad de los formatos de
 * boletín disponibles en el backend: de aquí salen tanto el renderer usado al
 * generar el PDF como el catálogo que el Super Admin consume para asignar un
 * formato a cada institución.
 *
 * ── REGLA ARQUITECTÓNICA: UN TEMPLATE = UNA UNIDAD COMPLETA DE DISEÑO ──────
 * La institución SOLO guarda el ID del template en
 * `institution_report_configs.config.template`. Ese ID determina el renderer,
 * su identidad visual y su metadata. NO se decide el diseño por nombre de
 * institución, por condiciones dispersas ni dentro de los componentes.
 *
 * Para agregar un nuevo formato (p.ej. "colegio_nuevo"):
 *   1. Crear su renderer LaTeX en `templates/<id>/index.js` (unidad completa:
 *      su propia paleta, encabezado, tablas, firmas, pie…).
 *   2. Registrar aquí el mismo ID con su `render` y metadata (`label`,
 *      `description`). NO añadir condiciones `if institucion === …`.
 *   3. Registrar el mismo ID en el frontend (`client/src/lib/reports/registry.ts`)
 *      y, si aplica, en el catálogo de respaldo
 *      (`client/src/lib/reports/template-metadata.ts`).
 * Al actualizar un template, TODAS las instituciones con ese ID lo reciben
 * automáticamente al generar el boletín (no hay copias por institución).
 * ────────────────────────────────────────────────────────────────────────────
 */
const templates = new Map([
  ['default', { render: renderDefaultBoletin, label: 'Formato estándar', description: 'Formato institucional estándar' }],
  [
    'liceo_alegre_juventud',
    {
      render: renderLiceoBoletin,
      label: 'Liceo Alegre Juventud',
      description: 'Formato institucional del Liceo Alegre Juventud',
    },
  ],
]);

export function getTemplate(name) {
  const entry = templates.get(name);
  return entry ? entry.render : templates.get('default').render;
}

/** Permite sumar la plantilla de una institución sin tocar el motor. */
export function registerTemplate(name, renderFn, meta = {}) {
  templates.set(name, { render: renderFn, ...meta });
}

export const availableTemplates = () => [...templates.keys()];

/** Catálogo de plantillas con metadatos para la gestión en Super Admin. */
export const templateCatalog = () =>
  [...templates.entries()].map(([id, entry]) => ({
    id,
    name: entry.label || id,
    description: entry.description || '',
    pdf: true,
    excel: true,
  }));
