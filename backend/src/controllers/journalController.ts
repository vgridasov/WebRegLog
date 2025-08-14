import { Response } from 'express';
import { Journal } from '../models/Journal';
import { Record } from '../models/Record';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

export const createJournal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { name, description, uniqueId, fields, access } = req.body;

    // Проверяем уникальность идентификатора
    const existingJournal = await Journal.findOne({ uniqueId });
    if (existingJournal) {
      return res.status(400).json({ message: 'Журнал с таким идентификатором уже существует' });
    }

    // Создаем новый журнал
    const journal = new Journal({
      name,
      description,
      uniqueId,
      fields: fields.sort((a: any, b: any) => a.order - b.order),
      access: access || [],
      createdBy: req.user._id
    });

    await journal.save();

    // Заполняем информацию о пользователях в доступе
    const populatedJournal = await Journal.findById(journal._id)
      .populate('access.userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      message: 'Журнал успешно создан',
      journal: populatedJournal
    });
  } catch (error) {
    console.error('Ошибка создания журнала:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const getJournals = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    let journals;

    // Администратор видит все журналы
    if (req.user.role === 'admin') {
      journals = await Journal.find({ isActive: true })
        .populate('createdBy', 'firstName lastName email')
        .populate('access.userId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else {
      // Обычные пользователи видят только журналы, к которым у них есть доступ
      journals = await Journal.find({
        isActive: true,
        'access.userId': req.user._id
      })
        .populate('createdBy', 'firstName lastName email')
        .populate('access.userId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    // Добавляем количество записей для каждого журнала
    const journalsWithCounts = await Promise.all(
      journals.map(async (journal) => {
        const recordCount = await Record.countDocuments({ journalId: journal._id });
        return {
          ...journal.toObject(),
          recordCount
        };
      })
    );

    res.json({
      journals: journalsWithCounts
    });
  } catch (error) {
    console.error('Ошибка получения журналов:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const getJournalById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { journalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(journalId)) {
      return res.status(400).json({ message: 'Неверный ID журнала' });
    }

    const journal = await Journal.findById(journalId)
      .populate('createdBy', 'firstName lastName email')
      .populate('access.userId', 'firstName lastName email');

    if (!journal) {
      return res.status(404).json({ message: 'Журнал не найден' });
    }

    // Проверяем доступ к журналу
    if (req.user.role !== 'admin') {
      const hasAccess = journal.access.some(
        access => access.userId._id.toString() === req.user!._id.toString()
      );

      if (!hasAccess) {
        return res.status(403).json({ message: 'Нет доступа к данному журналу' });
      }
    }

    // Добавляем количество записей
    const recordCount = await Record.countDocuments({ journalId: journal._id });

    res.json({
      journal: {
        ...journal.toObject(),
        recordCount
      }
    });
  } catch (error) {
    console.error('Ошибка получения журнала:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const updateJournal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { journalId } = req.params;
    const { name, description, fields, access } = req.body;

    if (!mongoose.Types.ObjectId.isValid(journalId)) {
      return res.status(400).json({ message: 'Неверный ID журнала' });
    }

    const journal = await Journal.findById(journalId);
    if (!journal) {
      return res.status(404).json({ message: 'Журнал не найден' });
    }

    // Обновляем поля журнала
    if (name) journal.name = name;
    if (description !== undefined) journal.description = description;
    if (fields) journal.fields = fields.sort((a: any, b: any) => a.order - b.order);
    if (access) journal.access = access;

    await journal.save();

    const updatedJournal = await Journal.findById(journal._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('access.userId', 'firstName lastName email');

    res.json({
      message: 'Журнал успешно обновлен',
      journal: updatedJournal
    });
  } catch (error) {
    console.error('Ошибка обновления журнала:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const deleteJournal = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const { journalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(journalId)) {
      return res.status(400).json({ message: 'Неверный ID журнала' });
    }

    const journal = await Journal.findById(journalId);
    if (!journal) {
      return res.status(404).json({ message: 'Журнал не найден' });
    }

    // Мягкое удаление - помечаем как неактивный
    journal.isActive = false;
    await journal.save();

    res.json({
      message: 'Журнал успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления журнала:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

export const getAvailableUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    // Получаем всех активных пользователей, кроме администраторов
    const users = await User.find({
      isActive: true,
      role: { $in: ['registrar', 'analyst'] }
    }).select('firstName lastName email role');

    res.json({
      users
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};
