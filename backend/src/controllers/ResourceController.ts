import { Request, Response } from 'express';
import { Resource, VpsInstance, Log } from '../models';

export class ResourceController {
    // Get resource information
    public static async getResources(req: Request, res: Response): Promise<void> {
        try {
            // Get the latest resource record
            const resource = await Resource.findOne().sort({ lastUpdated: -1 });

            if (!resource) {
                // If no resource record exists, create a default one
                const defaultResource = new Resource({
                    totalCpu: 32,
                    totalRam: 32768, // 32GB in MB
                    totalStorage: 1024, // 1TB in GB
                    usedCpu: 0,
                    usedRam: 0,
                    usedStorage: 0
                });

                await defaultResource.save();

                res.status(200).json({
                    success: true,
                    data: {
                        resource: defaultResource,
                        usage: {
                            cpuUsage: 0,
                            ramUsage: 0,
                            storageUsage: 0,
                            availableCpu: 32,
                            availableRam: 32768,
                            availableStorage: 1024
                        }
                    }
                });
                return;
            }

            // Calculate usage percentages
            const cpuUsage = (resource.usedCpu / resource.totalCpu) * 100;
            const ramUsage = (resource.usedRam / resource.totalRam) * 100;
            const storageUsage = (resource.usedStorage / resource.totalStorage) * 100;

            // Get actual VPS usage from database
            const vpsInstances = await VpsInstance.find({ status: 'running' });
            const actualCpuUsage = vpsInstances.reduce((sum, vps) => sum + vps.cpu, 0);
            const actualRamUsage = vpsInstances.reduce((sum, vps) => sum + vps.ram, 0);
            const actualStorageUsage = vpsInstances.reduce((sum, vps) => sum + vps.storage, 0);

            res.status(200).json({
                success: true,
                data: {
                    resource: {
                        id: resource._id,
                        totalCpu: resource.totalCpu,
                        totalRam: resource.totalRam,
                        totalStorage: resource.totalStorage,
                        usedCpu: resource.usedCpu,
                        usedRam: resource.usedRam,
                        usedStorage: resource.usedStorage,
                        lastUpdated: resource.lastUpdated
                    },
                    usage: {
                        cpuUsage: Math.round(cpuUsage * 100) / 100,
                        ramUsage: Math.round(ramUsage * 100) / 100,
                        storageUsage: Math.round(storageUsage * 100) / 100,
                        availableCpu: resource.totalCpu - resource.usedCpu,
                        availableRam: resource.totalRam - resource.usedRam,
                        availableStorage: resource.totalStorage - resource.usedStorage
                    },
                    actualUsage: {
                        actualCpuUsage,
                        actualRamUsage,
                        actualStorageUsage,
                        runningVpsCount: vpsInstances.length
                    },
                    summary: {
                        totalVps: await VpsInstance.countDocuments(),
                        runningVps: vpsInstances.length,
                        stoppedVps: await VpsInstance.countDocuments({ status: 'stopped' }),
                        pausedVps: await VpsInstance.countDocuments({ status: 'paused' }),
                        errorVps: await VpsInstance.countDocuments({ status: 'error' })
                    }
                }
            });
        } catch (error) {
            console.error('Get resources error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update resource information (admin only)
    public static async updateResources(req: Request, res: Response): Promise<void> {
        try {
            const {
                totalCpu,
                totalRam,
                totalStorage,
                usedCpu,
                usedRam,
                usedStorage
            } = req.body;
            const userId = req.user?.userId;

            // Validate input
            if (totalCpu !== undefined && (totalCpu < 1 || totalCpu > 128)) {
                res.status(400).json({
                    success: false,
                    message: 'Total CPU must be between 1 and 128'
                });
                return;
            }

            if (totalRam !== undefined && (totalRam < 1024 || totalRam > 131072)) {
                res.status(400).json({
                    success: false,
                    message: 'Total RAM must be between 1024MB and 131072MB (128GB)'
                });
                return;
            }

            if (totalStorage !== undefined && (totalStorage < 100 || totalStorage > 10240)) {
                res.status(400).json({
                    success: false,
                    message: 'Total Storage must be between 100GB and 10240GB (10TB)'
                });
                return;
            }

            // Get current resource record
            let resource = await Resource.findOne().sort({ lastUpdated: -1 });

            if (!resource) {
                // Create new resource record if none exists
                resource = new Resource({
                    totalCpu: totalCpu || 32,
                    totalRam: totalRam || 32768,
                    totalStorage: totalStorage || 1024,
                    usedCpu: usedCpu || 0,
                    usedRam: usedRam || 0,
                    usedStorage: usedStorage || 0
                });
            } else {
                // Update existing resource record
                if (totalCpu !== undefined) resource.totalCpu = totalCpu;
                if (totalRam !== undefined) resource.totalRam = totalRam;
                if (totalStorage !== undefined) resource.totalStorage = totalStorage;
                if (usedCpu !== undefined) resource.usedCpu = usedCpu;
                if (usedRam !== undefined) resource.usedRam = usedRam;
                if (usedStorage !== undefined) resource.usedStorage = usedStorage;

                resource.lastUpdated = new Date();
            }

            await resource.save();

            // Log the resource update
            const log = new Log({
                action: 'Resources Updated',
                vpsId: null, // No specific VPS for resource updates
                userId: userId,
                details: `System resources updated: CPU=${resource.totalCpu}, RAM=${resource.totalRam}MB, Storage=${resource.totalStorage}GB`
            });
            await log.save();

            // Calculate usage percentages
            const cpuUsage = (resource.usedCpu / resource.totalCpu) * 100;
            const ramUsage = (resource.usedRam / resource.totalRam) * 100;
            const storageUsage = (resource.usedStorage / resource.totalStorage) * 100;

            res.status(200).json({
                success: true,
                message: 'Resources updated successfully',
                data: {
                    resource: {
                        id: resource._id,
                        totalCpu: resource.totalCpu,
                        totalRam: resource.totalRam,
                        totalStorage: resource.totalStorage,
                        usedCpu: resource.usedCpu,
                        usedRam: resource.usedRam,
                        usedStorage: resource.usedStorage,
                        lastUpdated: resource.lastUpdated
                    },
                    usage: {
                        cpuUsage: Math.round(cpuUsage * 100) / 100,
                        ramUsage: Math.round(ramUsage * 100) / 100,
                        storageUsage: Math.round(storageUsage * 100) / 100,
                        availableCpu: resource.totalCpu - resource.usedCpu,
                        availableRam: resource.totalRam - resource.usedRam,
                        availableStorage: resource.totalStorage - resource.usedStorage
                    }
                }
            });
        } catch (error) {
            console.error('Update resources error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get resource statistics
    public static async getResourceStats(req: Request, res: Response): Promise<void> {
        try {
            // Get current resource information
            const resource = await Resource.findOne().sort({ lastUpdated: -1 });

            if (!resource) {
                res.status(404).json({
                    success: false,
                    message: 'No resource information found'
                });
                return;
            }

            // Get VPS statistics
            const vpsStats = await VpsInstance.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalCpu: { $sum: '$cpu' },
                        totalRam: { $sum: '$ram' },
                        totalStorage: { $sum: '$storage' }
                    }
                }
            ]);

            // Get resource usage by VPS
            const vpsUsage = await VpsInstance.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCpuUsed: { $sum: '$cpu' },
                        totalRamUsed: { $sum: '$ram' },
                        totalStorageUsed: { $sum: '$storage' },
                        totalVps: { $sum: 1 }
                    }
                }
            ]);

            // Calculate efficiency metrics
            const cpuEfficiency = resource.totalCpu > 0 ? (resource.usedCpu / resource.totalCpu) * 100 : 0;
            const ramEfficiency = resource.totalRam > 0 ? (resource.usedRam / resource.totalRam) * 100 : 0;
            const storageEfficiency = resource.totalStorage > 0 ? (resource.usedStorage / resource.totalStorage) * 100 : 0;

            res.status(200).json({
                success: true,
                data: {
                    resource: {
                        totalCpu: resource.totalCpu,
                        totalRam: resource.totalRam,
                        totalStorage: resource.totalStorage,
                        usedCpu: resource.usedRam,
                        usedRam: resource.usedRam,
                        usedStorage: resource.usedStorage,
                        lastUpdated: resource.lastUpdated
                    },
                    vpsStats,
                    vpsUsage: vpsUsage[0] || {
                        totalCpuUsed: 0,
                        totalRamUsed: 0,
                        totalStorageUsed: 0,
                        totalVps: 0
                    },
                    efficiency: {
                        cpuEfficiency: Math.round(cpuEfficiency * 100) / 100,
                        ramEfficiency: Math.round(ramEfficiency * 100) / 100,
                        storageEfficiency: Math.round(storageEfficiency * 100) / 100,
                        overallEfficiency: Math.round(((cpuEfficiency + ramEfficiency + storageEfficiency) / 3) * 100) / 100
                    },
                    recommendations: {
                        cpuRecommendation: cpuEfficiency > 80 ? 'Consider adding more CPU resources' : 'CPU usage is optimal',
                        ramRecommendation: ramEfficiency > 80 ? 'Consider adding more RAM resources' : 'RAM usage is optimal',
                        storageRecommendation: storageEfficiency > 80 ? 'Consider adding more storage resources' : 'Storage usage is optimal'
                    }
                }
            });
        } catch (error) {
            console.error('Get resource stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Auto-update resource usage based on VPS instances
    public static async autoUpdateResourceUsage(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            // Get all running VPS instances
            const runningVps = await VpsInstance.find({ status: 'running' });

            // Calculate actual usage
            const actualCpuUsage = runningVps.reduce((sum, vps) => sum + vps.cpu, 0);
            const actualRamUsage = runningVps.reduce((sum, vps) => sum + vps.ram, 0);
            const actualStorageUsage = runningVps.reduce((sum, vps) => sum + vps.storage, 0);

            // Get current resource record
            let resource = await Resource.findOne().sort({ lastUpdated: -1 });

            if (!resource) {
                res.status(404).json({
                    success: false,
                    message: 'No resource configuration found'
                });
                return;
            }

            // Update usage
            resource.usedCpu = actualCpuUsage;
            resource.usedRam = actualRamUsage;
            resource.usedStorage = actualStorageUsage;
            resource.lastUpdated = new Date();

            await resource.save();

            // Log the auto-update
            const log = new Log({
                action: 'Resource Usage Auto-Updated',
                vpsId: null,
                userId: userId,
                details: `Resource usage auto-updated: CPU=${actualCpuUsage}, RAM=${actualRamUsage}MB, Storage=${actualStorageUsage}GB`
            });
            await log.save();

            res.status(200).json({
                success: true,
                message: 'Resource usage updated automatically',
                data: {
                    previousUsage: {
                        cpu: resource.usedCpu,
                        ram: resource.usedRam,
                        storage: resource.usedStorage
                    },
                    newUsage: {
                        cpu: actualCpuUsage,
                        ram: actualRamUsage,
                        storage: actualStorageUsage
                    },
                    runningVpsCount: runningVps.length
                }
            });
        } catch (error) {
            console.error('Auto-update resource usage error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
