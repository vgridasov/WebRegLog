import axios, { AxiosResponse, AxiosError } from 'axios';
import { 
  User, 
  AuthResponse, 
  Journal, 
  CreateJournalRequest, 
  Record, 
  CreateRecordRequest, 
  UpdateRecordRequest,
  RecordsResponse,
  RecordSearchParams
} from '../types';

// Конфигурация API клиента
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Интерцептор для добавления токена в заголовки
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Типы для API ответов
interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// API для аутентификации
export const authAPI = {
  // Регистрация
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  // Вход
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Получение профиля
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data;
  },

  // Обновление токена
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('/auth/refresh');
    return response.data;
  },
};

// API для журналов
export const journalsAPI = {
  // Получить все доступные журналы
  getJournals: async (): Promise<{ journals: Journal[] }> => {
    const response = await api.get<{ journals: Journal[] }>('/journals');
    return response.data;
  },

  // Получить журнал по ID
  getJournalById: async (journalId: string): Promise<{ journal: Journal }> => {
    const response = await api.get<{ journal: Journal }>(`/journals/${journalId}`);
    return response.data;
  },

  // Создать новый журнал
  createJournal: async (journalData: CreateJournalRequest): Promise<{ journal: Journal }> => {
    const response = await api.post<{ journal: Journal }>('/journals', journalData);
    return response.data;
  },

  // Обновить журнал
  updateJournal: async (
    journalId: string, 
    updateData: Partial<CreateJournalRequest>
  ): Promise<{ journal: Journal }> => {
    const response = await api.put<{ journal: Journal }>(`/journals/${journalId}`, updateData);
    return response.data;
  },

  // Удалить журнал
  deleteJournal: async (journalId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/journals/${journalId}`);
    return response.data;
  },

  // Получить доступных пользователей
  getAvailableUsers: async (): Promise<{ users: User[] }> => {
    const response = await api.get<{ users: User[] }>('/journals/users/available');
    return response.data;
  },
};

// API для записей
export const recordsAPI = {
  // Получить записи журнала
  getRecords: async (
    journalId: string, 
    params?: RecordSearchParams
  ): Promise<RecordsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.filters) queryParams.append('filters', JSON.stringify(params.filters));

    const response = await api.get<RecordsResponse>(
      `/records/journal/${journalId}?${queryParams.toString()}`
    );
    return response.data;
  },

  // Получить запись по ID
  getRecordById: async (recordId: string): Promise<{ record: Record }> => {
    const response = await api.get<{ record: Record }>(`/records/${recordId}`);
    return response.data;
  },

  // Создать новую запись
  createRecord: async (recordData: CreateRecordRequest): Promise<{ record: Record }> => {
    const response = await api.post<{ record: Record }>('/records', recordData);
    return response.data;
  },

  // Обновить запись
  updateRecord: async (
    recordId: string, 
    updateData: UpdateRecordRequest
  ): Promise<{ record: Record }> => {
    const response = await api.put<{ record: Record }>(`/records/${recordId}`, updateData);
    return response.data;
  },

  // Удалить запись
  deleteRecord: async (recordId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/records/${recordId}`);
    return response.data;
  },

  // Экспорт записей
  exportRecords: async (
    journalId: string, 
    format: 'xlsx' | 'csv' = 'xlsx',
    filters?: any
  ): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    if (filters) queryParams.append('filters', JSON.stringify(filters));

    const response = await api.get(
      `/records/export/${journalId}?${queryParams.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  },
};

// Утилиты для работы с ошибками API
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Произошла неизвестная ошибка';
};

export const getValidationErrors = (error: any): Array<{field: string, message: string}> => {
  return error.response?.data?.errors || [];
};

export default api;
