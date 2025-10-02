import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
    action: string;
    vpsId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    timestamp: Date;
    details?: string;
}

const LogSchema = new Schema<ILog>({
    action: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    vpsId: {
        type: Schema.Types.ObjectId,
        ref: 'VpsInstance',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: {
        type: String,
        trim: true,
        maxlength: 500
    }
});

// Indexes for better query performance
LogSchema.index({ vpsId: 1 });
LogSchema.index({ userId: 1 });
LogSchema.index({ timestamp: -1 });
LogSchema.index({ action: 1 });

export default mongoose.model<ILog>('Log', LogSchema);
