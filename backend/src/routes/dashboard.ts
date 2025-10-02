import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Protected routes
router.get('/stats', authenticateToken, DashboardController.getStats);

export default router;
