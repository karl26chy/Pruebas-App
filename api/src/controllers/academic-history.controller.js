import * as service from '../services/academic-history.service.js';

/** GET /students/:studentId/academic-history con filtros opcionales. */
export async function academicHistory(req, res, next) {
  try {
    const { studentId } = req.params;
    const { anio, periodo, grado_id, materia_id } = req.query;
    res.json(
      await service.academicHistory(studentId, req.user, { anio, periodo, grado_id, materia_id })
    );
  } catch (err) {
    next(err);
  }
}
