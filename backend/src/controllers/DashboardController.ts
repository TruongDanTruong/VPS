import { Request, Response } from 'express';
import { User } from '../models';
import { VpsInstance } from '../models';
import { Log } from '../models';
import { Resource } from '../models';

export class DashboardController {
    public static async getStats(req: Request, res: Response): Promise<void> {
        try {
            // Count total users
            const totalUsers = await User.countDocuments();

            // Count total VPS instances
            const totalVps = await VpsInstance.countDocuments();

            // Count total logs
            const totalLogs = await Log.countDocuments();

            // Count total resources
            const totalResources = await Resource.countDocuments();

            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalVps,
                    totalLogs,
                    totalResources
                }
            });
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
