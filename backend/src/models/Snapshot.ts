import mongoose, { Document, Schema } from 'mongoose';

export interface ISnapshot extends Document {
    vpsId: mongoose.Types.ObjectId;
    name: string;
    createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>({
    vpsId: {
        type: Schema.Types.ObjectId,
        ref: 'VpsInstance',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for better query performance
SnapshotSchema.index({ vpsId: 1 });
SnapshotSchema.index({ createdAt: -1 });

export default mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);
