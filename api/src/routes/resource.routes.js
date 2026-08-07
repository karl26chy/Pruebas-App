import express from 'express';
import { requireAuthOrPublic } from '../middleware/optional-auth.js';
import * as controller from '../controllers/resource.controller.js';

/**
 * Rutas CRUD genéricas para todos los recursos del catálogo.
 * Solo declaran el mapeo verbo + ruta → controlador.
 */
const router = express.Router();

router.use(requireAuthOrPublic);

router.get('/:resource', controller.list);
router.get('/:resource/:id', controller.getOne);
router.post('/:resource', controller.create);
router.put('/:resource/:id', controller.replace);
router.patch('/:resource/:id', controller.replace);
router.delete('/:resource/:id', controller.destroy);

export default router;
