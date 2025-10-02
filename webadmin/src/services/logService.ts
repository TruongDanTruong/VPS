import api from './api';

export interface Log {
    id: string;
    action: string;
    description?: string;
    vpsId?: string;
    vpsName?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failed' | 'pending';
    createdAt: string;
    updatedAt: string;
}

export interface LogsResponse {
    logs: Log[];
    total: number;
    page: number;
    limit: number;
}

export interface LogFilters {
    userId?: string;
    vpsId?: string;
    action?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export const logService = {
    // Get all logs with filters
    getLogs: async (filters: LogFilters = {}): Promise<LogsResponse> => {
        const params = new URLSearchParams();

        if (filters.userId) params.append('userId', filters.userId);
        if (filters.vpsId) params.append('vpsId', filters.vpsId);
        if (filters.action) params.append('action', filters.action);
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await api.get(`/logs?${params.toString()}`);
        return response.data.data;
    },

    // Get log by ID
    getLogById: async (id: string): Promise<Log> => {
        const response = await api.get(`/logs/${id}`);
        return response.data.data.log;
    },

    // Get log statistics
    getLogStats: async () => {
        const response = await api.get('/logs/stats');
        return response.data.data;
    },

    // Get available actions for filter
    getLogActions: async (): Promise<string[]> => {
        const response = await api.get('/logs/actions');
        return response.data.data.actions;
    },

    // Get logs by user
    getUserLogs: async (userId: string, page: number = 1, limit: number = 10): Promise<LogsResponse> => {
        const response = await api.get(`/logs/user/${userId}?page=${page}&limit=${limit}`);
        return response.data.data;
    },

    // Get logs by VPS
    getVpsLogs: async (vpsId: string, page: number = 1, limit: number = 10): Promise<LogsResponse> => {
        const response = await api.get(`/logs/vps/${vpsId}?page=${page}&limit=${limit}`);
        return response.data.data;
    }
};
