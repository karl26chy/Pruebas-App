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
