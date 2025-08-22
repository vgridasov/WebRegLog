import { Response } from 'express';
import { Record } from '../models/Record';
import { Journal } from '../models/Journal';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';

export const createRecord = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { journalId, data } = req.body;

    if (!mongoose.Types.ObjectId.isValid(journalId)) {
      return res.status(400).json({ message: 'Неверный ID журнала' });
    }

    // Проверяем существование журнала
    const journal = await Journal.findById(journalId);
    if (!journal || !journal.isActive) {
      return res.status(404).json({ message: 'Журнал не найден' });
    }

    // Валидируем данные согласно структуре журнала
    const validationErrors = validateRecordData(data, journal.fields);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Ошибка валидации данных',
        errors: validationErrors
      });
    }

    // Создаем новую запись
    const record = new Record({
      journalId,
      data,
      createdBy: req.user._id
    });

    await record.save();

    const populatedRecord = await Record.findById(record._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Запись успешно создана',
      record: populatedRecord
    });
  } catch (error) {
    console.error('Ошибка создания записи:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const getRecords = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { journalId } = req.params;
    const { page = 1, limit = 50, search, filters } = req.query;

    if (!mongoose.Types.ObjectId.isValid(journalId)) {
      return res.status(400).json({ message: 'Неверный ID журнала' });
    }

    // Базовый запрос
    let query: any = { journalId };

    // Поиск по тексту
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { 'data': { $regex: searchRegex } }
      ];
    }

    // Применяем фильтры
    if (filters) {
      const parsedFilters = JSON.parse(filters as string);
      Object.keys(parsedFilters).forEach(key => {
        if (parsedFilters[key]) {
          query[`data.${key}`] = parsedFilters[key];
        }
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Record.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Record.countDocuments(query)
    ]);

    res.json({
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Ошибка получения записей:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const getRecordById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { recordId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Неверный ID записи' });
    }

    const record = await Record.findById(recordId)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!record) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json({
      record
    });
  } catch (error) {
    console.error('Ошибка получения записи:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const updateRecord = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { recordId } = req.params;
    const { data } = req.body;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Неверный ID записи' });
    }

    const record = await Record.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    // Получаем структуру журнала для валидации
    const journal = await Journal.findById(record.journalId);
    if (!journal) {
      return res.status(404).json({ message: 'Журнал не найден' });
    }

    // Валидируем данные
    const validationErrors = validateRecordData(data, journal.fields);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Ошибка валидации данных',
        errors: validationErrors
      });
    }

    // Обновляем запись
    record.data = data;
    record.updatedBy = req.user._id;
    await record.save();

    const updatedRecord = await Record.findById(record._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    res.json({
      message: 'Запись успешно обновлена',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Ошибка обновления записи:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const deleteRecord = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { recordId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ message: 'Неверный ID записи' });
    }

    const record = await Record.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    await Record.findByIdAndDelete(recordId);

    res.json({
      message: 'Запись успешно удалена'
    });
  } catch (error) {
    console.error('Ошибка удаления записи:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const exportRecords = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { journalId } = req.params;
    const { format = 'xlsx', filters } = req.query;

    if (!mongoose.Types.ObjectId.isValid(journalId)) {
      return res.status(400).json({ message: 'Неверный ID журнала' });
    }

    // Получаем журнал и его структуру
    const journal = await Journal.findById(journalId);
    if (!journal) {
      return res.status(404).json({ message: 'Журнал не найден' });
    }

    // Строим запрос с фильтрами
    let query: any = { journalId };
    if (filters) {
      const parsedFilters = JSON.parse(filters as string);
      Object.keys(parsedFilters).forEach(key => {
        if (parsedFilters[key]) {
          query[`data.${key}`] = parsedFilters[key];
        }
      });
    }

    // Получаем все записи
    const records = await Record.find(query)
      .populate<{ createdBy: { firstName: string; lastName: string; email: string } }>('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Формируем данные для экспорта
    const exportData = records.map(record => {
      const row: any = {};
      
      // Добавляем поля журнала
      journal.fields.forEach(field => {
        row[field.label] = record.data[field.id] || '';
      });
      
      // Добавляем системные поля
      row['Создано'] = record.createdAt.toLocaleDateString('ru-RU');
      row['Автор'] = `${(record.createdBy as any).firstName} ${(record.createdBy as any).lastName}`;
      
      return row;
    });

    // Создаем Excel файл
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, journal.name);

    // Настраиваем ответ
    const filename = `${journal.uniqueId}_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv); // BOM для корректного отображения в Excel
    } else {
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    }
  } catch (error) {
    console.error('Ошибка экспорта записей:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

// Вспомогательная функция валидации данных записи
function validateRecordData(data: any, fields: any[]): string[] {
  const errors: string[] = [];

  fields.forEach(field => {
    const value = data[field.id];

    // Проверка обязательности
    if (field.required && (!value || value === '')) {
      errors.push(`Поле "${field.label}" обязательно для заполнения`);
      return;
    }

    // Пропускаем валидацию, если значение пустое и поле не обязательное
    if (!value && !field.required) {
      return;
    }

    // Валидация по типу поля
    switch (field.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`Поле "${field.label}" должно содержать число`);
        } else if (field.validation) {
          const num = Number(value);
          if (field.validation.min !== undefined && num < field.validation.min) {
            errors.push(`Поле "${field.label}" не может быть меньше ${field.validation.min}`);
          }
          if (field.validation.max !== undefined && num > field.validation.max) {
            errors.push(`Поле "${field.label}" не может быть больше ${field.validation.max}`);
          }
        }
        break;
      
      case 'date':
        if (isNaN(Date.parse(value))) {
          errors.push(`Поле "${field.label}" должно содержать корректную дату`);
        }
        break;
      
      case 'select':
      case 'radio':
        if (field.options && !field.options.includes(value)) {
          errors.push(`Недопустимое значение для поля "${field.label}"`);
        }
        break;
      
      case 'text':
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors.push(`Поле "${field.label}" не соответствует требуемому формату`);
          }
        }
        break;
    }
  });

  return errors;
}
