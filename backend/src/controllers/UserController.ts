import { Request, Response } from 'express';
import { User } from '../models';

export class UserController {
    // Get all users (admin only)
    public static async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            // Build search query
            const searchQuery = search
                ? {
                    $or: [
                        { username: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]
                }
                : {};

            // Get users with pagination
            const users = await User.find(searchQuery)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            // Get total count for pagination
            const totalUsers = await User.countDocuments(searchQuery);

            res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        currentPage: Number(page),
                        totalPages: Math.ceil(totalUsers / Number(limit)),
                        totalUsers,
                        hasNext: skip + Number(limit) < totalUsers,
                        hasPrev: Number(page) > 1
                    }
                }
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get user by ID
    public static async getUserById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const user = await User.findById(id).select('-password');

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: { user }
            });
        } catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update user
    public static async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { username, email, role } = req.body;
            const currentUserId = req.user?.userId;

            // Check if user exists
            const user = await User.findById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Check if user is updating themselves or is admin
            if (currentUserId !== id && req.user?.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'You can only update your own profile'
                });
                return;
            }

            // Check for duplicate email/username if updating
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    res.status(400).json({
                        success: false,
                        message: 'Email already exists'
                    });
                    return;
                }
            }

            if (username && username !== user.username) {
                const existingUser = await User.findOne({ username });
                if (existingUser) {
                    res.status(400).json({
                        success: false,
                        message: 'Username already exists'
                    });
                    return;
                }
            }

            // Update user
            const updateData: any = {};
            if (username) updateData.username = username;
            if (email) updateData.email = email;
            if (role && req.user?.role === 'admin') updateData.role = role;

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: { user: updatedUser }
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete user
    public static async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.userId;

            // Check if user exists
            const user = await User.findById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Check if user is deleting themselves or is admin
            if (currentUserId !== id && req.user?.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'You can only delete your own account'
                });
                return;
            }

            // Prevent admin from deleting themselves
            if (currentUserId === id && req.user?.role === 'admin') {
                res.status(400).json({
                    success: false,
                    message: 'Admin cannot delete their own account'
                });
                return;
            }

            // Delete user
            await User.findByIdAndDelete(id);

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Change password
    public static async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.userId;

            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
                return;
            }

            // Find user
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Verify current password
            const bcrypt = require('bcrypt');
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
                return;
            }

            // Hash new password
            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Update password
            await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
