import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Resource routes
router.get('/', ResourceController.getResources);
router.get('/stats', ResourceController.getResourceStats);
router.put('/update', requireAdmin, ResourceController.updateResources);
router.put('/auto-update', requireAdmin, ResourceController.autoUpdateResourceUsage);

export default router;
