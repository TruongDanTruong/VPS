import { Request, Response } from 'express';
import { Log, VpsInstance, User } from '../models';

export class LogController {
    // Get logs with user/admin permissions
    public static async getLogs(req: Request, res: Response): Promise<void> {
        try {
            const {
                page = 1,
                limit = 20,
                action = '',
                vpsId = '',
                userId = '',
                startDate = '',
                endDate = ''
            } = req.query;

            const skip = (Number(page) - 1) * Number(limit);
            const currentUserId = req.user?.userId;
            const userRole = req.user?.role;

            // Build query based on user role
            let query: any = {};

            // If user is not admin, only show logs related to their VPS
            if (userRole !== 'admin') {
                // Get VPS IDs owned by current user
                const userVpsIds = await VpsInstance.find({ ownerId: currentUserId }).select('_id');
                const vpsIds = userVpsIds.map(vps => vps._id);

                // Filter logs by user's VPS or user's own actions
                query.$or = [
                    { vpsId: { $in: vpsIds } },
                    { userId: currentUserId }
                ];
            }

            // Add action filter
            if (action) {
                query.action = { $regex: action, $options: 'i' };
            }

            // Add VPS filter
            if (vpsId) {
                query.vpsId = vpsId;
            }

            // Add user filter (admin only)
            if (userId && userRole === 'admin') {
                query.userId = userId;
            }

            // Add date range filter
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) {
                    query.timestamp.$gte = new Date(startDate as string);
                }
                if (endDate) {
                    query.timestamp.$lte = new Date(endDate as string);
                }
            }

            // Get logs with pagination
            const logs = await Log.find(query)
                .populate('vpsId', 'name status ipAddress ownerId')
                .populate('userId', 'username email role')
                .populate({
                    path: 'vpsId',
                    populate: {
                        path: 'ownerId',
                        select: 'username email'
                    }
                })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Get total count for pagination
            const totalLogs = await Log.countDocuments(query);

            // Get summary statistics
            const stats = await Log.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    logs,
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalLogs / Number(limit)),
                        totalLogs,
                        hasNext: skip + Number(limit) < totalLogs,
                        hasPrev: Number(page) > 1
                    },
                    stats: {
                        actionCounts: stats,
                        totalActions: stats.reduce((sum, stat) => sum + stat.count, 0)
                    }
                }
            });
        } catch (error) {
            console.error('Get logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get logs for specific VPS
    public static async getVpsLogs(req: Request, res: Response): Promise<void> {
        try {
            const { vpsId } = req.params;
            const { page = 1, limit = 20, action = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const currentUserId = req.user?.userId;
            const userRole = req.user?.role;

            // Check if VPS exists and user has access
            const vps = await VpsInstance.findById(vpsId);
            if (!vps) {
                res.status(404).json({
                    success: false,
                    message: 'VPS not found'
                });
                return;
            }

            // Check if user can access this VPS
            if (userRole !== 'admin' && vps.ownerId.toString() !== currentUserId) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only view logs of your own VPS.'
                });
                return;
            }

            // Build query
            let query: any = { vpsId };

            // Add action filter
            if (action) {
                query.action = { $regex: action, $options: 'i' };
            }

            // Get logs for this VPS
            const logs = await Log.find(query)
                .populate('userId', 'username email role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Get total count for pagination
            const totalLogs = await Log.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    logs,
                    vps: {
                        id: vps._id,
                        name: vps.name,
                        status: vps.status,
                        ipAddress: vps.ipAddress
                    },
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalLogs / Number(limit)),
                        totalLogs,
                        hasNext: skip + Number(limit) < totalLogs,
                        hasPrev: Number(page) > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get VPS logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get logs for specific user (admin only)
    public static async getUserLogs(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, action = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const userRole = req.user?.role;

            // Only admin can view logs of specific users
            if (userRole !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
                return;
            }

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Build query
            let query: any = { userId };

            // Add action filter
            if (action) {
                query.action = { $regex: action, $options: 'i' };
            }

            // Get logs for this user
            const logs = await Log.find(query)
                .populate('vpsId', 'name status ipAddress')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Get total count for pagination
            const totalLogs = await Log.countDocuments(query);

            res.status(200).json({
                success: true,
                data: {
                    logs,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    },
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalLogs / Number(limit)),
                        totalLogs,
                        hasNext: skip + Number(limit) < totalLogs,
                        hasPrev: Number(page) > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get user logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get log statistics
    public static async getLogStats(req: Request, res: Response): Promise<void> {
        try {
            const { startDate = '', endDate = '' } = req.query;
            const currentUserId = req.user?.userId;
            const userRole = req.user?.role;

            // Build base query
            let baseQuery: any = {};

            // If user is not admin, only show stats for their VPS
            if (userRole !== 'admin') {
                const userVpsIds = await VpsInstance.find({ ownerId: currentUserId }).select('_id');
                const vpsIds = userVpsIds.map(vps => vps._id);

                baseQuery.$or = [
                    { vpsId: { $in: vpsIds } },
                    { userId: currentUserId }
                ];
            }

            // Add date range filter
            if (startDate || endDate) {
                baseQuery.timestamp = {};
                if (startDate) {
                    baseQuery.timestamp.$gte = new Date(startDate as string);
                }
                if (endDate) {
                    baseQuery.timestamp.$lte = new Date(endDate as string);
                }
            }

            // Get various statistics
            const [
                totalLogs,
                actionStats,
                userStats,
                vpsStats,
                recentLogs
            ] = await Promise.all([
                // Total logs count
                Log.countDocuments(baseQuery),

                // Action statistics
                Log.aggregate([
                    { $match: baseQuery },
                    {
                        $group: {
                            _id: '$action',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } }
                ]),

                // User statistics (admin only)
                userRole === 'admin' ? Log.aggregate([
                    { $match: baseQuery },
                    {
                        $group: {
                            _id: '$userId',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]) : [],

                // VPS statistics
                Log.aggregate([
                    { $match: baseQuery },
                    {
                        $group: {
                            _id: '$vpsId',
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]),

                // Recent logs
                Log.find(baseQuery)
                    .populate('userId', 'username email')
                    .populate('vpsId', 'name status')
                    .sort({ timestamp: -1 })
                    .limit(5)
            ]);

            res.status(200).json({
                success: true,
                data: {
                    summary: {
                        totalLogs,
                        actionStats,
                        userStats: userRole === 'admin' ? userStats : null,
                        vpsStats,
                        recentLogs
                    }
                }
            });
        } catch (error) {
            console.error('Get log stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
