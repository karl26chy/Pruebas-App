import * as reportService from '../services/report.service.js';
import * as pdfService from '../services/pdf/pdf.service.js';
import { HttpError } from '../shared/http-error.js';

export async function getReport(req, res, next) {
  try {
    const { studentId } = req.params;
    const { period_id, anio } = req.query;
    if (anio !== undefined) {
      res.json(await reportService.getYearReport(req.user, studentId, anio));
    } else {
      res.json(await reportService.getReport(req.user, studentId, period_id));
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Boletín PDF individual por período (LaTeX/Tectonic).
 * Reutiliza getReport: misma autorización (solo admin de la institución),
 * mismo aislamiento por institución y los mismos datos de AcademicReportData.
 */
export async function getReportPDF(req, res, next) {
  try {
    const { studentId } = req.params;
    const { period_id } = req.query;

    const data = await reportService.getReport(req.user, studentId, period_id);
    const { buffer, fileName } = await pdfService.renderBoletinPDF(
      data,
      data.institution?.reportConfig || null
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

/** Catálogo de formatos de boletín (solo Super Admin). */
export async function listReportTemplates(req, res, next) {
  try {
    if (req.user?.rol !== 'super_admin') {
      throw new HttpError(403, 'Solo el Super Administrador puede gestionar los formatos de boletín.');
    }
    res.json(reportService.listReportTemplates());
  } catch (err) {
    next(err);
  }
}
