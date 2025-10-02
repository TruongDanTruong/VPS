import api from './api';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        user: {
            id: string;
            username: string;
            email?: string;
            role?: string;
            createdAt?: string;
        };
    };
}

export const authService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getToken: (): string | null => {
        return localStorage.getItem('token');
    },

    isAuthenticated: (): boolean => {
        const token = localStorage.getItem('token');
        return !!token;
    },

    getCurrentUser: () => {
        const userString = localStorage.getItem('user');
        if (userString === null || userString === 'undefined') {
            return null;
        }
        try {
            return JSON.parse(userString);
        } catch (e) {
            console.error("Error parsing user from localStorage:", e);
            localStorage.removeItem('user');
            return null;
        }
    }
};
