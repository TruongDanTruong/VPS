import api from './api';

export interface VpsInstance {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'paused' | 'error';
    cpu: number;
    ram: number;
    storage: number;
    ipAddress: string;
    os: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

export interface CreateVpsRequest {
    name: string;
    cpu: number;
    ram: number;
    storage: number;
    os: string;
    ipAddress?: string;
}

export interface UpdateVpsRequest {
    name?: string;
    cpu?: number;
    ram?: number;
    storage?: number;
    os?: string;
    ipAddress?: string;
}

export interface VpsResponse {
    vps: VpsInstance[];
    total: number;
    page: number;
    limit: number;
}

export const vpsService = {
    // Get all VPS instances
    getVpsList: async (page: number = 1, limit: number = 10): Promise<VpsResponse> => {
        const response = await api.get(`/vps?page=${page}&limit=${limit}`);
        return response.data.data;
    },

    // Get VPS by ID
    getVpsById: async (id: string): Promise<VpsInstance> => {
        const response = await api.get(`/vps/${id}`);
        return response.data.data.vps;
    },

    // Create new VPS
    createVps: async (vpsData: CreateVpsRequest): Promise<VpsInstance> => {
        const response = await api.post('/vps/create', vpsData);
        return response.data.data.vps;
    },

    // Update VPS
    updateVps: async (id: string, vpsData: UpdateVpsRequest): Promise<VpsInstance> => {
        const response = await api.put(`/vps/${id}`, vpsData);
        return response.data.data.vps;
    },

    // Delete VPS
    deleteVps: async (id: string): Promise<void> => {
        await api.delete(`/vps/${id}`);
    },

    // VPS Actions
    startVps: async (id: string): Promise<VpsInstance> => {
        const response = await api.put(`/vps/${id}/start`);
        return response.data.data.vps;
    },

    stopVps: async (id: string): Promise<VpsInstance> => {
        const response = await api.put(`/vps/${id}/stop`);
        return response.data.data.vps;
    },

    restartVps: async (id: string): Promise<VpsInstance> => {
        const response = await api.put(`/vps/${id}/restart`);
        return response.data.data.vps;
    },

    // Get VPS statistics
    getVpsStats: async () => {
        const response = await api.get('/vps/stats');
        return response.data.data;
    }
};
