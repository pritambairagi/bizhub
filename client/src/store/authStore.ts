import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  businessId?: string;
  branchId?: string;
  permissions?: string[]; // Added permissions
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<void>;
  register: (data: { email?: string; phone?: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  employeeRegister: (data: { email?: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', credentials);
          const { user, tokens } = data.data;

          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', userData);
          const { user, tokens } = data.data;

          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      employeeRegister: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/employee-register', userData);
          const { user, tokens } = data.data;

          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        api.post('/auth/logout').catch(() => {});
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        delete api.defaults.headers.common['Authorization'];
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          const { tokens } = data.data;

          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        } catch {
          get().logout();
        }
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get('/auth/profile');
          if (data.data) {
            set({ user: data.data });
          }
        } catch (error) {
          console.error('Failed to fetch profile', error);
        }
      },
    }),
    {
      name: 'bizhub-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize API with token
const initializeApi = () => {
  const state = useAuthStore.getState();
  if (state.accessToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
  }
};

initializeApi();

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as { config?: { _retry?: boolean; headers?: Record<string, string> }; response?: { status?: number } };
    const originalRequest = axiosError.config;

    if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refreshAccessToken();
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${useAuthStore.getState().accessToken}`;
        }
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);