import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { useJournalStore } from '../store/journalStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../components/UI/Notification';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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

  const handleJournalClick = (journalId: string) => {
    navigate(`/journal/${journalId}`);
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUserRole = (journalAccess: any[]) => {
    if (!user) return null;
    
    const access = journalAccess.find(a => a.userId.id === user.id);
    return access?.role;
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'registrar':
        return 'Регистратор';
      case 'analyst':
        return 'Аналитик';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Доступные журналы
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Выберите журнал для работы с записями
            </p>
          </div>
          
          {/* Кнопка админ-панели для администраторов */}
          {user?.role === 'admin' && (
            <button
              onClick={handleAdminPanel}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Админ-панель
            </button>
          )}
        </div>

        {/* Список журналов */}
        {journals.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Нет доступных журналов</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'admin' 
                ? 'Создайте новый журнал в админ-панели'
                : 'Обратитесь к администратору для получения доступа к журналам'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journals.map((journal) => {
              const userRole = getUserRole(journal.access);
              
              return (
                <div
                  key={journal._id}
                  onClick={() => handleJournalClick(journal._id)}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-indigo-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {journal.name}
                        </h3>
                        {journal.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {journal.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {journal.recordCount || 0} записей
                          </div>
                          
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            {user?.role === 'admin' ? 'Администратор' : getRoleDisplayName(userRole || '')}
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-400">
                          Создан {formatDate(journal.createdAt)}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;
