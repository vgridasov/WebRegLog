import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '../types';
import { authAPI, handleApiError } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  loadUser: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Вход в систему
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response: AuthResponse = await authAPI.login({ email, password });
          
          // Сохраняем токен и данные пользователя
          localStorage.setItem('token', response.token);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Регистрация
      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response: AuthResponse = await authAPI.register(userData);
          
          // Сохраняем токен и данные пользователя
          localStorage.setItem('token', response.token);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = handleApiError(error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      // Выход из системы
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Очистка ошибок
      clearError: () => {
        set({ error: null });
      },

      // Загрузка пользователя (при восстановлении сессии)
      loadUser: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        
        try {
          const response = await authAPI.getProfile();
          
          set({
            user: response.user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Токен недействителен
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Обновление токена
      refreshToken: async () => {
        try {
          const response = await authAPI.refreshToken();
          localStorage.setItem('token', response.token);
          
          set({
            token: response.token,
          });
        } catch (error) {
          // Если не удалось обновить токен, выходим
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
