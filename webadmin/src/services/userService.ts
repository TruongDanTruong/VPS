import api from './api';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    role?: 'admin' | 'user';
}

export interface UsersResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
}

export const userService = {
    // Get all users
    getUsers: async (page: number = 1, limit: number = 10): Promise<UsersResponse> => {
        const response = await api.get(`/users?page=${page}&limit=${limit}`);
        return response.data.data;
    },

    // Get user by ID
    getUserById: async (id: string): Promise<User> => {
        const response = await api.get(`/users/${id}`);
        return response.data.data.user;
    },

    // Create new user (register)
    createUser: async (userData: CreateUserRequest): Promise<User> => {
        const response = await api.post('/auth/register', userData);
        return response.data.data.user;
    },

    // Update user
    updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data.data.user;
    },

    // Delete user
    deleteUser: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    // Get user profile
    getProfile: async (): Promise<User> => {
        const response = await api.get('/auth/profile');
        return response.data.data.user;
    }
};
