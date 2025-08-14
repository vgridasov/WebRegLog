// Типы пользователей
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'registrar' | 'analyst';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

// Типы полей формы
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
  order: number;
}

// Типы доступа к журналу
export interface JournalAccess {
  userId: string;
  role: 'registrar' | 'analyst';
}

// Типы журнала
export interface Journal {
  _id: string;
  name: string;
  description?: string;
  uniqueId: string;
  fields: FieldDefinition[];
  access: (JournalAccess & { userId: User })[];
  createdBy: User;
  isActive: boolean;
  recordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalRequest {
  name: string;
  description?: string;
  uniqueId: string;
  fields: FieldDefinition[];
  access?: JournalAccess[];
}

// Типы записей
export interface RecordData {
  [fieldId: string]: any;
}

export interface Record {
  _id: string;
  journalId: string;
  data: RecordData;
  createdBy: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordRequest {
  journalId: string;
  data: RecordData;
}

export interface UpdateRecordRequest {
  data: RecordData;
}

// Типы для пагинации
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RecordsResponse {
  records: Record[];
  pagination: Pagination;
}

// Типы для фильтрации
export interface RecordFilters {
  [fieldId: string]: any;
}

export interface RecordSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: RecordFilters;
}

// Типы для API ответов
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Типы для состояния загрузки
export interface LoadingState {
  [key: string]: boolean;
}

// Типы для уведомлений
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

// Типы для экспорта
export type ExportFormat = 'xlsx' | 'csv';

export interface ExportParams {
  format: ExportFormat;
  filters?: RecordFilters;
}

// Типы для состояния приложения
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: LoadingState;
  notifications: Notification[];
}

// Типы для роутинга
export interface RouteParams {
  journalId?: string;
  recordId?: string;
}

// Утилитарные типы
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
