import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import { useJournalStore } from '../store/journalStore';
import { useNotificationStore } from '../components/UI/Notification';
import CreateJournalModal from '../components/Admin/CreateJournalModal';
import JournalList from '../components/Admin/JournalList';

const AdminPanel: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { journals, isLoading, error, fetchJournals } = useJournalStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: error,
      });
    }
  }, [error, addNotification]);

  const handleCreateJournal = () => {
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <Layout title="Административная панель">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Административная панель">
      <div className="space-y-6">
        {/* Заголовок и действия */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Управление журналами
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Создавайте и настраивайте журналы, управляйте доступом пользователей
            </p>
          </div>

          <button
            onClick={handleCreateJournal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Создать журнал
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Всего журналов</h3>
                <p className="text-2xl font-bold text-indigo-600">{journals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Всего записей</h3>
                <p className="text-2xl font-bold text-green-600">
                  {journals.reduce((sum, journal) => sum + (journal.recordCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Активные пользователи</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {journals.reduce((users, journal) => {
                    journal.access.forEach(access => {
                      const userId = access.userId.id;
                      users.add(userId);
                    });
                    return users;
                  }, new Set()).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Список журналов */}
        <JournalList journals={journals} />

        {/* Модальное окно создания журнала */}
        {isCreateModalOpen && (
          <CreateJournalModal 
            isOpen={isCreateModalOpen}
            onClose={handleModalClose}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
