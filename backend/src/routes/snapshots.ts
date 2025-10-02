import { Router } from 'express';
import { SnapshotController } from '../controllers/SnapshotController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// VPS-specific snapshot routes
router.post('/vps/:id/snapshot', SnapshotController.createSnapshot);
router.get('/vps/:id/snapshots', SnapshotController.getVpsSnapshots);

// General snapshot routes
router.get('/all', requireAdmin, SnapshotController.getAllSnapshots);
router.get('/:id', SnapshotController.getSnapshotById);
router.delete('/:id', SnapshotController.deleteSnapshot);
router.put('/:id/restore', SnapshotController.restoreFromSnapshot);

export default router;
