import express from 'express';
import requireAuth from '../middleware/require-auth.js';
import * as controller from '../controllers/report.controller.js';

const router = express.Router();

router.get('/students/:studentId/report', requireAuth, controller.getReport);

export default router;
