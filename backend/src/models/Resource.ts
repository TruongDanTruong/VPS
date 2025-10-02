import mongoose, { Document, Schema } from 'mongoose';

export interface IResource extends Document {
    totalCpu: number;
    totalRam: number; // in MB
    totalStorage: number; // in GB
    usedCpu: number;
    usedRam: number; // in MB
    usedStorage: number; // in GB
    lastUpdated: Date;
}

const ResourceSchema = new Schema<IResource>({
    totalCpu: {
        type: Number,
        required: true,
        min: 1,
        max: 128
    },
    totalRam: {
        type: Number,
        required: true,
        min: 1024, // 1GB minimum
        max: 131072 // 128GB maximum
    },
    totalStorage: {
        type: Number,
        required: true,
        min: 100, // 100GB minimum
        max: 10240 // 10TB maximum
    },
    usedCpu: {
        type: Number,
        required: true,
        min: 0,
        max: 128
    },
    usedRam: {
        type: Number,
        required: true,
        min: 0,
        max: 131072
    },
    usedStorage: {
        type: Number,
        required: true,
        min: 0,
        max: 10240
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Index for better query performance
ResourceSchema.index({ lastUpdated: -1 });

// Virtual for available resources
ResourceSchema.virtual('availableCpu').get(function () {
    return this.totalCpu - this.usedCpu;
});

ResourceSchema.virtual('availableRam').get(function () {
    return this.totalRam - this.usedRam;
});

ResourceSchema.virtual('availableStorage').get(function () {
    return this.totalStorage - this.usedStorage;
});

// Ensure virtual fields are serialized
ResourceSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IResource>('Resource', ResourceSchema);
