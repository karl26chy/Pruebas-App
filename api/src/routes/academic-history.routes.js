import express from 'express';
import requireAuth from '../middleware/require-auth.js';
import * as controller from '../controllers/academic-history.controller.js';

const router = express.Router();

router.get('/students/:studentId/academic-history', requireAuth, controller.academicHistory);

export default router;
