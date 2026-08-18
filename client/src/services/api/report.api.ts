import { http, ApiError, API_BASE, getAuthToken, setAuthToken, UNAUTHORIZED_EVENT } from '../http';
import type { AcademicReportData, AcademicYearReportData } from '../../lib/reports/types';
import type { ReportTemplateInfo } from '../../types';

/** Extrae el nombre de archivo de la cabecera Content-Disposition. */
function parseContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const m = /filename\*=(?:UTF-8''|")([^";]+)"/i.exec(header) || /filename=([^;]+)/i.exec(header);
  return m ? m[1].replace(/^"|"$/g, '') : null;
}

export const reportApi = {
  /** Catálogo de formatos de boletín disponibles (solo Super Admin). */
  getReportTemplates: () => http.get<ReportTemplateInfo[]>('/report-templates'),
  /** Reporte académico individual de un estudiante para un período concreto. */
  getStudentReport: (studentId: string, periodId: string) =>
    http.get<AcademicReportData>(
      `/students/${encodeURIComponent(studentId)}/report?period_id=${encodeURIComponent(periodId)}`
    ),
  /** Reporte ANUAL de un estudiante (períodos y materias dinámicos). */
  getStudentYearReport: (studentId: string, anio: number) =>
    http.get<AcademicYearReportData>(
      `/students/${encodeURIComponent(studentId)}/report?anio=${encodeURIComponent(String(anio))}`
    ),
  /**
   * Boletín PDF individual (LaTeX/Tectonic en el backend) por período.
   * Descarga el archivo directamente en el navegador.
   */
  downloadBoletinPDF: async (studentId: string, periodId: string): Promise<void> => {
    const url = `${API_BASE}/students/${encodeURIComponent(studentId)}/report/pdf?period_id=${encodeURIComponent(periodId)}`;
    const token = getAuthToken();

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        cache: 'no-store',
      });
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el servidor API. Verifica que el backend esté activo.');
    }

    if (!response.ok) {
      let message = `API error: ${response.status} ${response.statusText}`;
      try {
        const data = await response.json();
        if (data?.error) message = String(data.error);
      } catch {
        // respuesta sin cuerpo JSON
      }
      if (response.status === 401) {
        setAuthToken(null);
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
      throw new ApiError(response.status, message);
    }

    const blob = await response.blob();
    const filename = parseContentDisposition(response.headers.get('Content-Disposition')) || `boletin_${periodId}.pdf`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  },
};
