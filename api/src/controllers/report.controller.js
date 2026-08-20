import * as reportService from '../services/report.service.js';

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
