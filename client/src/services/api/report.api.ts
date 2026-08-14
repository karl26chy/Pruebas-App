import { http } from '../http';
import type { AcademicReportData } from '../../lib/reports/types';

export const reportApi = {
  /** Reporte académico individual de un estudiante para un período concreto. */
  getStudentReport: (studentId: string, periodId: string) =>
    http.get<AcademicReportData>(
      `/students/${encodeURIComponent(studentId)}/report?period_id=${encodeURIComponent(periodId)}`
    ),
};
