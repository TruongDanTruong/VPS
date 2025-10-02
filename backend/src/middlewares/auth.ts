import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';

// Extend Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                username: string;
                email: string;
                role: string;
            };
        }
    }
}

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwtSecret) as any;

        // Check if user still exists
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        // Attach user info to request
        req.user = {
            userId: (user._id as any).toString(),
            username: user.username,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
            return;
        }

        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired'
            });
            return;
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Middleware to check if user is admin
export const requireAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
        return;
    }
    next();
};

// Middleware to check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const resourceOwnerId = req.params.userId || req.body.ownerId;
    const currentUserId = req.user?.userId;

    if (req.user?.role === 'admin' || resourceOwnerId === currentUserId) {
        next();
        return;
    }

    res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
    });
};
