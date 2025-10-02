import api from './api';

export interface Resource {
    id: string;
    totalCpu: number;
    totalRam: number; // in MB
    totalStorage: number; // in GB
    usedCpu: number;
    usedRam: number; // in MB
    usedStorage: number; // in GB
    lastUpdated: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Usage {
    cpuUsage: number; // percentage
    ramUsage: number; // percentage
    storageUsage: number; // percentage
    availableCpu: number;
    availableRam: number; // in MB
    availableStorage: number; // in GB
}

export interface Summary {
    totalVps: number;
    runningVps: number;
    stoppedVps: number;
    pausedVps: number;
    errorVps: number;
}

export interface ResourceResponse {
    resource: Resource;
    usage: Usage;
    summary: Summary;
}

export interface UpdateResourceRequest {
    totalCpu?: number;
    totalRam?: number;
    totalStorage?: number;
}

export const resourceService = {
    // Get current resource information
    getResources: async (): Promise<ResourceResponse> => {
        const response = await api.get('/resources');
        return response.data.data;
    },

    // Get resource by ID
    getResourceById: async (id: string): Promise<Resource> => {
        const response = await api.get(`/resources/${id}`);
        return response.data.data.resource;
    },

    // Update resource (Admin only)
    updateResource: async (id: string, resourceData: UpdateResourceRequest): Promise<Resource> => {
        const response = await api.put(`/resources/${id}`, resourceData);
        return response.data.data.resource;
    },

    // Update current resource settings
    updateCurrentResource: async (resourceData: UpdateResourceRequest): Promise<Resource> => {
        const response = await api.put('/resources/update', resourceData);
        return response.data.data.resource;
    },

    // Get resource statistics
    getResourceStats: async () => {
        const response = await api.get('/resources/stats');
        return response.data.data;
    },

    // Get resource usage history
    getResourceHistory: async (days: number = 7) => {
        const response = await api.get(`/resources/history?days=${days}`);
        return response.data.data;
    },

    // Get resource alerts
    getResourceAlerts: async () => {
        const response = await api.get('/resources/alerts');
        return response.data.data;
    }
};