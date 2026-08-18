import type { ReportTemplateInfo } from '../../types';

/**
 * Catálogo local de formatos de boletín. La fuente de verdad es el endpoint
 * `GET /report-templates` del backend; este mapa es SOLO un respaldo para que
 * la UI siga mostrando nombres amigables si el catálogo remoto no está
 * disponible, y para la selección inmediata al crear/editar una institución.
 */
export const REPORT_TEMPLATE_FALLBACK: ReportTemplateInfo[] = [
  {
    id: 'default',
    name: 'Formato estándar',
    description: 'Formato institucional estándar',
    pdf: true,
    excel: true,
  },
  {
    id: 'liceo_alegre_juventud',
    name: 'Liceo Alegre Juventud',
    description: 'Formato institucional del Liceo Alegre Juventud',
    pdf: true,
    excel: true,
  },
];

/** Nombre amigable de un id de template, con fallback al propio id. */
export function templateLabel(id: string | null | undefined, catalog: ReportTemplateInfo[]): string {
  if (!id) return 'Formato estándar';
  return catalog.find(t => t.id === id)?.name || id;
}
