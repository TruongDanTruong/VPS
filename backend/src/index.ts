import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { config } from './config';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import vpsRoutes from './routes/vps';
import snapshotRoutes from './routes/snapshots';
import logRoutes from './routes/logs';
import resourceRoutes from './routes/resources';
import dashboardRoutes from './routes/dashboard';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'VPS Backend API is running!',
        version: '1.0.0',
        environment: config.nodeEnv
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/vps', vpsRoutes);
app.use('/snapshots', snapshotRoutes);
app.use('/logs', logRoutes);
app.use('/resources', resourceRoutes);
app.use('/dashboard', dashboardRoutes);

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();

        const PORT = config.port;
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📊 Environment: ${config.nodeEnv}`);
            console.log(`🌐 CORS Origin: ${config.corsOrigin}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
