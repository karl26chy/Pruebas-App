import type { AcademicYearReportData, ReportConfig } from './types';

/**
 * Contrato de una plantilla de boletín: cada institución puede aportar la
 * suya (renderPDF + renderExcel) sin tocar el motor. El contenido académico
 * SIEMPRE viene de AcademicYearReportData (materias y períodos dinámicos).
 */
export interface ReportTemplate {
  name: string;
  renderPDF: (data: AcademicYearReportData, config: ReportConfig | null) => void | Promise<void>;
  renderExcel: (data: AcademicYearReportData, config: ReportConfig | null) => void | Promise<void>;
}

/** Defaults razonables que el JSON de configuración puede sobrescribir. */
export function mergeConfig(config: ReportConfig | null): {
  primary: [number, number, number];
  secondary: [number, number, number];
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
    primary: parseColor(raw.primaryColor, [136, 112, 48]),
    secondary: parseColor(raw.secondaryColor, [48, 48, 48]),
    showLogo: raw.showLogo !== false,
    showAttendance: raw.showAttendance !== false,
    showEvaluations: raw.showEvaluations !== false,
    showTeacher: raw.showTeacher !== false,
  };
}

/** Texto institucional del config (rectora, director, etc.), con fallback. */
export function configText(config: ReportConfig | null, key: string, fallback = ''): string {
  const v = config?.config?.[key];
  return typeof v === 'string' && v.trim() ? v : fallback;
}

/** Nombre de archivo individual del boletín (anual). */
export function reportFileName(data: AcademicYearReportData, extension: string): string {
  const nombre = `${data.student.nombre}_${data.student.apellido}`.replace(/\s+/g, '_');
  return `${nombre}_Ano_${data.year}.${extension}`;
}
