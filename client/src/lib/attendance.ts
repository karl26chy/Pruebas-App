import type { Attendance } from '../types';

/**
 * Métricas de asistencia.
 *
 * OJO: la plataforma usa DOS tasas distintas y no son intercambiables.
 * Se conservan tal cual estaban para no alterar las cifras que ya ve cada rol.
 */

export interface AttendanceCounts {
  presente: number;
  ausente: number;
  tardanza: number;
  total: number;
}

export function countByStatus(records: Attendance[]): AttendanceCounts {
  return {
    presente: records.filter(a => a.estado === 'presente').length,
    ausente: records.filter(a => a.estado === 'ausente').length,
    tardanza: records.filter(a => a.estado === 'tardanza').length,
    total: records.length,
  };
}

/**
 * Tasa usada en el panel del administrador y en el boletín:
 * solo cuenta las asistencias efectivas y devuelve 0 si no hay registros.
 */
export function attendanceRateStrict(records: Attendance[]): number {
  if (records.length === 0) return 0;
  const { presente } = countByStatus(records);
  return Math.round((presente / records.length) * 100);
}

/**
 * Tasa usada en el portal del estudiante: cuenta también las tardanzas como
 * presencia y devuelve 100 cuando todavía no hay registros.
 */
export function attendanceRateWithTardiness(records: Attendance[]): number {
  if (records.length === 0) return 100;
  const { presente, tardanza } = countByStatus(records);
  return Math.round(((presente + tardanza) / records.length) * 100);
}
