import { create } from 'zustand';
import { Journal, CreateJournalRequest, User } from '../types';
import { journalsAPI, handleApiError } from '../services/api';

interface JournalState {
  journals: Journal[];
  currentJournal: Journal | null;
  availableUsers: User[];
  isLoading: boolean;
  error: string | null;
}

interface JournalActions {
  fetchJournals: () => Promise<void>;
  fetchJournalById: (journalId: string) => Promise<void>;
  createJournal: (journalData: CreateJournalRequest) => Promise<void>;
  updateJournal: (journalId: string, updateData: Partial<CreateJournalRequest>) => Promise<void>;
  deleteJournal: (journalId: string) => Promise<void>;
  fetchAvailableUsers: () => Promise<void>;
  clearCurrentJournal: () => void;
  clearError: () => void;
}

type JournalStore = JournalState & JournalActions;

export const useJournalStore = create<JournalStore>((set, get) => ({
  // Начальное состояние
  journals: [],
  currentJournal: null,
  availableUsers: [],
  isLoading: false,
  error: null,

  // Получение списка журналов
  fetchJournals: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await journalsAPI.getJournals();
      set({
        journals: response.journals,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  // Получение журнала по ID
  fetchJournalById: async (journalId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await journalsAPI.getJournalById(journalId);
      set({
        currentJournal: response.journal,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({
        currentJournal: null,
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  // Создание журнала
  createJournal: async (journalData: CreateJournalRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await journalsAPI.createJournal(journalData);
      
      // Добавляем новый журнал в список
      set((state) => ({
        journals: [response.journal, ...state.journals],
        currentJournal: response.journal,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Обновление журнала
  updateJournal: async (journalId: string, updateData: Partial<CreateJournalRequest>) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await journalsAPI.updateJournal(journalId, updateData);
      
      // Обновляем журнал в списке
      set((state) => ({
        journals: state.journals.map((journal) =>
          journal._id === journalId ? response.journal : journal
        ),
        currentJournal: state.currentJournal?._id === journalId 
          ? response.journal 
          : state.currentJournal,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Удаление журнала
  deleteJournal: async (journalId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await journalsAPI.deleteJournal(journalId);
      
      // Удаляем журнал из списка
      set((state) => ({
        journals: state.journals.filter((journal) => journal._id !== journalId),
        currentJournal: state.currentJournal?._id === journalId 
          ? null 
          : state.currentJournal,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  // Получение доступных пользователей
  fetchAvailableUsers: async () => {
    try {
      const response = await journalsAPI.getAvailableUsers();
      set({
        availableUsers: response.users,
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({
        error: errorMessage,
      });
    }
  },

  // Очистка текущего журнала
  clearCurrentJournal: () => {
    set({ currentJournal: null });
  },

  // Очистка ошибок
  clearError: () => {
    set({ error: null });
  },
}));
