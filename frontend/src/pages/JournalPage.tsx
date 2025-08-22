import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { useJournalStore } from '../store/journalStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../components/UI/Notification';
import RecordsList from '../components/Journal/RecordsList';
import CreateRecordModal from '../components/Journal/CreateRecordModal';
import RecordFilters from '../components/Journal/RecordFilters';

const JournalPage: React.FC = () => {
  const { journalId } = useParams<{ journalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentJournal, isLoading, error, fetchJournalById, clearCurrentJournal } = useJournalStore();
  const { addNotification } = useNotificationStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (journalId) {
      fetchJournalById(journalId);
    }

    return () => {
      clearCurrentJournal();
    };
  }, [journalId, fetchJournalById, clearCurrentJournal]);

  useEffect(() => {
    if (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: error,
      });
      navigate('/');
    }
  }, [error, addNotification, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentJournal) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-900">Журнал не найден</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Вернуться к списку журналов
          </button>
        </div>
      </Layout>
    );
  }

  // Определяем роль пользователя в журнале
  const getUserRole = () => {
    if (user?.role === 'admin') return 'admin';
    
    const access = currentJournal.access.find(
      a => a.userId.id === user?.id
    );
    return access?.role;
  };

  const userRole = getUserRole();
  const canCreate = userRole === 'admin' || userRole === 'registrar';
  const canExport = userRole === 'admin' || userRole === 'analyst';

  const handleCreateRecord = () => {
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      // Импортируем API функцию
      const { recordsAPI } = await import('../services/api');
      
      const blob = await recordsAPI.exportRecords(journalId!, format, filters);
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentJournal.uniqueId}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        title: 'Экспорт завершен',
        message: `Файл ${format.toUpperCase()} готов к скачиванию`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка экспорта',
        message: 'Не удалось экспортировать данные',
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${currentJournal.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h1 { color: #333; }
              .header { margin-bottom: 20px; }
              .date { color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${currentJournal.name}</h1>
              <p>${currentJournal.description || ''}</p>
              <p class="date">Дата печати: ${new Date().toLocaleDateString('ru-RU')}</p>
            </div>
            <div id="content">Подготовка данных для печати...</div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Layout title={currentJournal.name}>
      <div className="space-y-6">
        {/* Заголовок журнала */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentJournal.name}
              </h1>
            </div>
            {currentJournal.description && (
              <p className="mt-1 text-sm text-gray-600">
                {currentJournal.description}
              </p>
            )}
            <div className="mt-2 text-xs text-gray-500">
              ID: {currentJournal.uniqueId} • 
              Записей: {currentJournal.recordCount || 0} • 
              Ваша роль: {userRole === 'admin' ? 'Администратор' : 
                        userRole === 'registrar' ? 'Регистратор' : 
                        userRole === 'analyst' ? 'Аналитик' : 'Нет доступа'}
            </div>
          </div>

          {/* Действия */}
          <div className="flex items-center space-x-3">
            {canExport && (
              <>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
                
                <button
                  onClick={() => handleExport('csv')}
                  className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>

                <button
                  onClick={handlePrint}
                  className="text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Печать
                </button>
              </>
            )}

            {canCreate && (
              <button
                onClick={handleCreateRecord}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Добавить запись
              </button>
            )}
          </div>
        </div>

        {/* Фильтры и поиск */}
        <RecordFilters
          fields={currentJournal.fields}
          onFiltersChange={handleFiltersChange}
          onSearchChange={handleSearchChange}
        />

        {/* Список записей */}
        <RecordsList
          journalId={journalId!}
          journal={currentJournal}
          filters={filters}
          searchQuery={searchQuery}
          userRole={userRole}
        />

        {/* Модальное окно создания записи */}
        {isCreateModalOpen && canCreate && (
          <CreateRecordModal
            isOpen={isCreateModalOpen}
            onClose={handleModalClose}
            journal={currentJournal}
          />
        )}
      </div>
    </Layout>
  );
};

export default JournalPage;
