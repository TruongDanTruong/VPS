import { Request, Response } from 'express';
import { Snapshot, VpsInstance, Log } from '../models';

export class SnapshotController {
    // Create snapshot for VPS
    public static async createSnapshot(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            // Check if VPS exists
            const vps = await VpsInstance.findById(id);
            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can access this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only create snapshots for your own VPS.'
                });
                return;
            }

            // Check if VPS is running (recommended to create snapshot when VPS is running)
            if (vps.status !== 'running') {
                res.status(400).json({
                    success: false,
                    message: 'VPS must be running to create snapshot'
                });
                return;
            }

            // Generate snapshot name if not provided
            const snapshotName = name || `snapshot-${Date.now()}`;

            // Create snapshot
            const snapshot = new Snapshot({
                vpsId: vps._id,
                name: snapshotName
            });

            await snapshot.save();

            // Log the snapshot creation
            const log = new Log({
                action: 'Snapshot Created',
                vpsId: vps._id,
                userId: userId,
                details: `Snapshot "${snapshotName}" created for VPS "${vps.name}"`
            });
            await log.save();

            // Populate VPS info
            await snapshot.populate('vpsId', 'name status ipAddress');

            res.status(201).json({
                success: true,
                message: 'Snapshot created successfully',
                data: { snapshot }
            });
        } catch (error) {
            console.error('Create snapshot error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get snapshots for a VPS
    public static async getVpsSnapshots(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            // Check if VPS exists
            const vps = await VpsInstance.findById(id);
            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can access this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view snapshots of your own VPS.'
                });
                return;
            }

            // Get snapshots for this VPS
            const snapshots = await Snapshot.find({ vpsId: id })
                .populate('vpsId', 'name status ipAddress')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Get total count for pagination
            const totalSnapshots = await Snapshot.countDocuments({ vpsId: id });

            res.status(200).json({
                success: true,
                data: {
                    snapshots,
                    vps: {
                        id: vps._id,
                        name: vps.name,
                        status: vps.status,
                        ipAddress: vps.ipAddress
                    },
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalSnapshots / Number(limit)),
                        totalSnapshots,
                        hasNext: skip + Number(limit) < totalSnapshots,
                        hasPrev: Number(page) > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get VPS snapshots error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get all snapshots (admin only)
    public static async getAllSnapshots(req: Request, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 10, vpsId = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const userRole = req.user?.role;

            // Only admin can see all snapshots
            if (userRole !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
                return;
            }

            // Build query
            let query: any = {};
            if (vpsId) {
                query.vpsId = vpsId;
            }

            // Get all snapshots
            const snapshots = await Snapshot.find(query)
                .populate('vpsId', 'name status ipAddress ownerId')
                .populate({
                    path: 'vpsId',
                    populate: {
                        path: 'ownerId',
                        select: 'username email'
                    }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Get total count for pagination
            const totalSnapshots = await Snapshot.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    snapshots,
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalSnapshots / Number(limit)),
                        totalSnapshots,
                        hasNext: skip + Number(limit) < totalSnapshots,
                        hasPrev: Number(page) > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get all snapshots error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get snapshot by ID
    public static async getSnapshotById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const snapshot = await Snapshot.findById(id)
                .populate('vpsId', 'name status ipAddress ownerId')
                .populate({
                    path: 'vpsId',
                    populate: {
                        path: 'ownerId',
                        select: 'username email'
                    }
                });

            if (!snapshot) {
                res.status(404).json({
                    success: false,
                    message: 'Snapshot not found'
                });
                return;
            }

            // Check if user can access this snapshot
            const vps = snapshot.vpsId as any;
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view snapshots of your own VPS.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: { snapshot }
            });
        } catch (error) {
            console.error('Get snapshot by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete snapshot
    public static async deleteSnapshot(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const snapshot = await Snapshot.findById(id).populate('vpsId', 'name ownerId');

            if (!snapshot) {
                res.status(404).json({
                    success: false,
                    message: 'Snapshot not found'
                });
                return;
            }

            // Check if user can delete this snapshot
            const vps = snapshot.vpsId as any;
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete snapshots of your own VPS.'
                });
                return;
            }

            // Delete snapshot
            await Snapshot.findByIdAndDelete(id);

            // Log the deletion
            const log = new Log({
                action: 'Snapshot Deleted',
                vpsId: snapshot.vpsId,
                userId: userId,
                details: `Snapshot "${snapshot.name}" deleted successfully`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'Snapshot deleted successfully'
            });
        } catch (error) {
            console.error('Delete snapshot error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Restore VPS from snapshot
    public static async restoreFromSnapshot(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const snapshot = await Snapshot.findById(id).populate('vpsId', 'name ownerId status');

            if (!snapshot) {
                res.status(404).json({
                    success: false,
                    message: 'Snapshot not found'
                });
                return;
            }

            // Check if user can restore from this snapshot
            const vps = snapshot.vpsId as any;
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only restore from snapshots of your own VPS.'
                });
                return;
            }

            // Check if VPS is stopped (recommended to restore when VPS is stopped)
            if (vps.status !== 'stopped') {
                res.status(400).json({
                    success: false,
                    message: 'VPS must be stopped to restore from snapshot'
                });
                return;
            }

            // Log the restoration
            const log = new Log({
                action: 'VPS Restored from Snapshot',
                vpsId: snapshot.vpsId,
                userId: userId,
                details: `VPS "${vps.name}" restored from snapshot "${snapshot.name}"`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'VPS restored from snapshot successfully',
                data: {
                    snapshot: {
                        id: snapshot._id,
                        name: snapshot.name,
                        createdAt: snapshot.createdAt
                    },
                    vps: {
                        id: vps._id,
                        name: vps.name,
                        status: vps.status
                    }
                }
            });
        } catch (error) {
            console.error('Restore from snapshot error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
