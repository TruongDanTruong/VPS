import mongoose, { Document, Schema } from 'mongoose';

export interface IVpsInstance extends Document {
    name: string;
    status: 'running' | 'stopped' | 'paused' | 'error';
    cpu: number;
    ram: number; // in MB
    storage: number; // in GB
    ipAddress: string;
    ownerId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const VpsInstanceSchema = new Schema<IVpsInstance>({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    status: {
        type: String,
        enum: ['running', 'stopped', 'paused', 'error'],
        default: 'stopped'
    },
    cpu: {
        type: Number,
        required: true,
        min: 1,
        max: 32
    },
    ram: {
        type: Number,
        required: true,
        min: 512, // 512MB minimum
        max: 32768 // 32GB maximum
    },
    storage: {
        type: Number,
        required: true,
        min: 10, // 10GB minimum
        max: 2048 // 2TB maximum
    },
    ipAddress: {
        type: String,
        required: true,
        unique: true,
        match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Please enter a valid IP address']
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
VpsInstanceSchema.index({ ownerId: 1 });
VpsInstanceSchema.index({ status: 1 });
VpsInstanceSchema.index({ ipAddress: 1 });

export default mongoose.model<IVpsInstance>('VpsInstance', VpsInstanceSchema);
