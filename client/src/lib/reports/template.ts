import type { AcademicReportData, ReportConfig } from './types';

/**
 * Contrato de una plantilla de boletín: cada institución puede aportar la
 * suya (renderPDF + renderExcel) sin tocar el motor. La que no tenga plantilla
 * personalizada usa la "default".
 */
export interface ReportTemplate {
  name: string;
  renderPDF: (data: AcademicReportData, config: ReportConfig | null) => void;
  renderExcel: (data: AcademicReportData, config: ReportConfig | null) => void;
}

/** Defaults razonables que el JSON de configuración puede sobrescribir. */
export function mergeConfig(config: ReportConfig | null): {
  primary: [number, number, number];
  showLogo: boolean;
  showAttendance: boolean;
  showEvaluations: boolean;
  showTeacher: boolean;
} {
  const raw = config?.config || {};
  const parseColor = (value: unknown, fallback: [number, number, number]): [number, number, number] => {
    if (typeof value === 'string' && /^#?([0-9a-f]{6})$/i.test(value)) {
      const hex = value.replace('#', '');
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    return fallback;
  };
  return {
    primary: parseColor(raw.primaryColor, [79, 70, 229]),
    showLogo: raw.showLogo !== false,
    showAttendance: raw.showAttendance !== false,
    showEvaluations: raw.showEvaluations !== false,
    showTeacher: raw.showTeacher !== false,
  };
}

/** Nombre de archivo individual del boletín. */
export function reportFileName(data: AcademicReportData, extension: string): string {
  const nombre = `${data.student.nombre}_${data.student.apellido}`.replace(/\s+/g, '_');
  return `${nombre}_Periodo_${data.period.numero}_${data.period.anio}.${extension}`;
}
