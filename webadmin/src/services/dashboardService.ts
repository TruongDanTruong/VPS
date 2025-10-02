import api from './api';

export interface DashboardStats {
    totalUsers: number;
    totalVps: number;
    totalLogs: number;
    totalResources: number;
}

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        try {
            // Gọi API để lấy thống kê từ backend
            const response = await api.get('/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Trả về dữ liệu mặc định nếu API lỗi
            return {
                totalUsers: 0,
                totalVps: 0,
                totalLogs: 0,
                totalResources: 0
            };
        }
    }
};
