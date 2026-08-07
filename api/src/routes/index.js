import express from 'express';
import authRoutes from './auth.routes.js';
import resourceRoutes from './resource.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/', resourceRoutes);

export default router;
