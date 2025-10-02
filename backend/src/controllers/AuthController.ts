import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';

export class AuthController {
    // Register new user
    public static async register(req: Request, res: Response): Promise<void> {
        try {
            const { username, email, password, role } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                res.status(400).json({
                    success: false,
                    message: 'User with this email or username already exists'
                });
                return;
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create new user
            const user = new User({
                username,
                email,
                password: hashedPassword,
                role: role || 'user'
            });

            await user.save();

            // Generate JWT token
            const payload = {
                userId: (user._id as any).toString(),
                username: user.username,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt
                    },
                    token
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Login user
    public static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
                return;
            }

            // Generate JWT token
            const payload = {
                userId: (user._id as any).toString(),
                username: user.username,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt
                    },
                    token
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get current user profile
    public static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const user = await User.findById(req.user?.userId).select('-password');

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    }
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}