import { Router } from 'express';
import { LogController } from '../controllers/LogController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// General log routes
router.get('/', LogController.getLogs);
router.get('/stats', LogController.getLogStats);

// VPS-specific log routes
router.get('/vps/:vpsId', LogController.getVpsLogs);

// User-specific log routes (admin only)
router.get('/user/:userId', requireAdmin, LogController.getUserLogs);

export default router;
