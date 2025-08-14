import React from 'react';
import { Journal } from '../../types';

interface RecordsListProps {
  journalId: string;
  journal: Journal;
  filters: any;
  searchQuery: string;
  userRole?: string;
}

const RecordsList: React.FC<RecordsListProps> = ({ 
  journalId, 
  journal, 
  filters, 
  searchQuery, 
  userRole 
}) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Записей пока нет</h3>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'admin' || userRole === 'registrar' 
              ? 'Создайте первую запись для начала работы'
              : 'Записи появятся здесь после их создания'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecordsList;
