import { Request, Response } from 'express';
import { VpsInstance, Log } from '../models';

export class VpsController {
    // Get all VPS instances
    public static async getAllVps(req: Request, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 10, status = '', search = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            // Build query based on user role
            let query: any = {};

            // If user is not admin, only show their own VPS
            if (userRole !== 'admin') {
                query.ownerId = userId;
            }

            // Add status filter
            if (status) {
                query.status = status;
            }

            // Add search filter
            if (search) {
                query.name = { $regex: search, $options: 'i' };
            }

            // Get VPS instances with pagination
            const vpsInstances = await VpsInstance.find(query)
                .populate('ownerId', 'username email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Get total count for pagination
            const totalVps = await VpsInstance.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    vpsInstances,
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalVps / Number(limit)),
                        totalVps,
                        hasNext: skip + Number(limit) < totalVps,
                        hasPrev: Number(page) > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get all VPS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get VPS by ID
    public static async getVpsById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const vps = await VpsInstance.findById(id).populate('ownerId', 'username email');

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
                    message: 'Access denied. You can only access your own VPS.'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: { vps }
            });
        } catch (error) {
            console.error('Get VPS by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Create new VPS
    public static async createVps(req: Request, res: Response): Promise<void> {
        try {
            const { name, cpu, ram, storage, ipAddress } = req.body;
            const ownerId = req.user?.userId;

            // Check if IP address is already in use
            const existingVps = await VpsInstance.findOne({ ipAddress });
            if (existingVps) {
                res.status(400).json({
                    success: false,
                    message: 'IP address is already in use'
                });
                return;
            }

            // Create new VPS instance
            const vps = new VpsInstance({
                name,
                cpu,
                ram,
                storage,
                ipAddress,
                ownerId,
                status: 'stopped'
            });

            await vps.save();

            // Log the creation
            const log = new Log({
                action: 'VPS Created',
                vpsId: vps._id,
                userId: ownerId,
                details: `VPS "${name}" created with ${cpu} CPU, ${ram}MB RAM, ${storage}GB storage`
            });
            await log.save();

            // Populate owner info
            await vps.populate('ownerId', 'username email');

            res.status(201).json({
                success: true,
                message: 'VPS created successfully',
                data: { vps }
            });
        } catch (error) {
            console.error('Create VPS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Start VPS
    public static async startVps(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const vps = await VpsInstance.findById(id);

            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can control this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only control your own VPS.'
                });
                return;
            }

            // Check if VPS is already running
            if (vps.status === 'running') {
                res.status(400).json({
                    success: false,
                    message: 'VPS is already running'
                });
                return;
            }

            // Update VPS status
            vps.status = 'running';
            await vps.save();

            // Log the action
            const log = new Log({
                action: 'VPS Started',
                vpsId: vps._id,
                userId: userId,
                details: `VPS "${vps.name}" started successfully`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'VPS started successfully',
                data: { vps }
            });
        } catch (error) {
            console.error('Start VPS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Stop VPS
    public static async stopVps(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const vps = await VpsInstance.findById(id);

            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can control this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only control your own VPS.'
                });
                return;
            }

            // Check if VPS is already stopped
            if (vps.status === 'stopped') {
                res.status(400).json({
                    success: false,
                    message: 'VPS is already stopped'
                });
                return;
            }

            // Update VPS status
            vps.status = 'stopped';
            await vps.save();

            // Log the action
            const log = new Log({
                action: 'VPS Stopped',
                vpsId: vps._id,
                userId: userId,
                details: `VPS "${vps.name}" stopped successfully`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'VPS stopped successfully',
                data: { vps }
            });
        } catch (error) {
            console.error('Stop VPS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Restart VPS
    public static async restartVps(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const vps = await VpsInstance.findById(id);

            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can control this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only control your own VPS.'
                });
                return;
            }

            // Check if VPS is not running
            if (vps.status !== 'running') {
                res.status(400).json({
                    success: false,
                    message: 'VPS must be running to restart'
                });
                return;
            }

            // Update VPS status (restart = stop then start)
            vps.status = 'running'; // Keep as running after restart
            await vps.save();

            // Log the action
            const log = new Log({
                action: 'VPS Restarted',
                vpsId: vps._id,
                userId: userId,
                details: `VPS "${vps.name}" restarted successfully`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'VPS restarted successfully',
                data: { vps }
            });
        } catch (error) {
            console.error('Restart VPS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete VPS
    public static async deleteVps(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const vps = await VpsInstance.findById(id);

            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can delete this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only delete your own VPS.'
                });
                return;
            }

            // Delete VPS
            await VpsInstance.findByIdAndDelete(id);

            // Log the deletion
            const log = new Log({
                action: 'VPS Deleted',
                vpsId: vps._id,
                userId: userId,
                details: `VPS "${vps.name}" deleted successfully`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'VPS deleted successfully'
            });
        } catch (error) {
            console.error('Delete VPS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update VPS
    public static async updateVps(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, cpu, ram, storage } = req.body;
            const userId = req.user?.userId;
            const userRole = req.user?.role;

            const vps = await VpsInstance.findById(id);

            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can update this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== userId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only update your own VPS.'
                });
                return;
            }

            // Update VPS
            const updateData: any = {};
            if (name) updateData.name = name;
            if (cpu) updateData.cpu = cpu;
            if (ram) updateData.ram = ram;
            if (storage) updateData.storage = storage;

            const updatedVps = await VpsInstance.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('ownerId', 'username email');

            // Log the update
            const log = new Log({
                action: 'VPS Updated',
                vpsId: vps._id,
                userId: userId,
                details: `VPS "${vps.name}" updated successfully`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'VPS updated successfully',
                data: { vps: updatedVps }
            });
        } catch (error) {
            console.error('Update VPS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
