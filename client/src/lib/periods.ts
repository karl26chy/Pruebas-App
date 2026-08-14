/**
 * Etiqueta canónica de un periodo académico: el número siempre visible y el
 * nombre descriptivo separado del número.
 *
 *   periodLabel({ numero: 1, nombre: 'Primer periodo', anio: 2026 })
 *   → "Periodo 1 — Primer periodo — 2026"
 *
 * Si el nombre es simplemente "Periodo X" y X coincide con `numero`, no se
 * repite:
 *
 *   periodLabel({ numero: 1, nombre: 'Periodo 1', anio: 2026 })
 *   → "Periodo 1 — 2026"
 */
export interface PeriodLike {
  numero?: number | null;
  nombre?: string;
  anio?: number | string | null;
}

export function periodLabel(p?: PeriodLike | null): string {
  if (!p) return '';
  const partes: string[] = [];
  if (p.numero !== undefined && p.numero !== null) {
    partes.push(`Periodo ${p.numero}`);
  }
  if (p.nombre) {
    const nombreLimpio = String(p.nombre).trim();
    // No repetir "Periodo X" cuando X coincide con el número del periodo.
    const esRedundante =
      p.numero !== undefined &&
      p.numero !== null &&
      nombreLimpio.toLowerCase() === `periodo ${p.numero}`.toLowerCase();
    if (!esRedundante) partes.push(nombreLimpio);
  }
  if (p.anio !== undefined && p.anio !== null && p.anio !== '') {
    partes.push(String(p.anio));
  }
  return partes.join(' — ');
}
