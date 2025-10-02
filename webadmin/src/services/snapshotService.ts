import api from './api';

export interface Snapshot {
    id: string;
    name: string;
    description?: string;
    vpsId: string;
    status: 'creating' | 'completed' | 'failed' | 'deleting';
    size: number; // in MB
    createdAt: string;
    updatedAt: string;
}

export interface CreateSnapshotRequest {
    name: string;
    description?: string;
}

export interface SnapshotsResponse {
    snapshots: Snapshot[];
    total: number;
    page: number;
    limit: number;
}

export const snapshotService = {
    // Get snapshots for a VPS
    getVpsSnapshots: async (vpsId: string, page: number = 1, limit: number = 10): Promise<SnapshotsResponse> => {
        const response = await api.get(`/vps/${vpsId}/snapshots?page=${page}&limit=${limit}`);
        return response.data.data;
    },

    // Get all snapshots
    getSnapshots: async (page: number = 1, limit: number = 10): Promise<SnapshotsResponse> => {
        const response = await api.get(`/snapshots?page=${page}&limit=${limit}`);
        return response.data.data;
    },

    // Get snapshot by ID
    getSnapshotById: async (id: string): Promise<Snapshot> => {
        const response = await api.get(`/snapshots/${id}`);
        return response.data.data.snapshot;
    },

    // Create snapshot for VPS
    createSnapshot: async (vpsId: string, snapshotData: CreateSnapshotRequest): Promise<Snapshot> => {
        const response = await api.post(`/vps/${vpsId}/snapshot`, snapshotData);
        return response.data.data.snapshot;
    },

    // Delete snapshot
    deleteSnapshot: async (id: string): Promise<void> => {
        await api.delete(`/snapshots/${id}`);
    },

    // Restore VPS from snapshot
    restoreFromSnapshot: async (vpsId: string, snapshotId: string): Promise<void> => {
        await api.post(`/vps/${vpsId}/restore`, { snapshotId });
    },

    // Get snapshot statistics
    getSnapshotStats: async () => {
        const response = await api.get('/snapshots/stats');
        return response.data.data;
    }
};
