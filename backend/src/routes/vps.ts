import { Router } from 'express';
import { VpsController } from '../controllers/VpsController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// VPS CRUD routes
router.get('/', VpsController.getAllVps);
router.get('/:id', VpsController.getVpsById);
router.post('/create', VpsController.createVps);
router.put('/:id', VpsController.updateVps);
router.delete('/:id', VpsController.deleteVps);

// VPS control routes
router.put('/:id/start', VpsController.startVps);
router.put('/:id/stop', VpsController.stopVps);
router.put('/:id/restart', VpsController.restartVps);

export default router;
