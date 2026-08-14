import express from 'express';
import authRoutes from './auth.routes.js';
import academicHistoryRoutes from './academic-history.routes.js';
import reportRoutes from './report.routes.js';
import resourceRoutes from './resource.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
// El historial debe declararse antes del CRUD genérico para que su ruta
// /students/:studentId/academic-history no caiga en el 404 de recursos.
router.use('/', academicHistoryRoutes);
router.use('/', reportRoutes);
router.use('/', resourceRoutes);

export default router;
