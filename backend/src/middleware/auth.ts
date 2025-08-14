import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Journal } from '../models/Journal';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Токен доступа не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Недействительный токен' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Требуется аутентификация' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Недостаточно прав доступа' });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);

export const requireJournalAccess = (requiredRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Требуется аутентификация' });
      }

      // Администратор имеет доступ ко всем журналам
      if (req.user.role === 'admin') {
        return next();
      }

      const journalId = req.params.journalId || req.body.journalId;
      if (!journalId) {
        return res.status(400).json({ message: 'ID журнала не указан' });
      }

      const journal = await Journal.findById(journalId);
      if (!journal) {
        return res.status(404).json({ message: 'Журнал не найден' });
      }

      // Проверяем доступ пользователя к журналу
      const userAccess = journal.access.find(
        access => access.userId.toString() === req.user!._id.toString()
      );

      if (!userAccess) {
        return res.status(403).json({ message: 'Нет доступа к данному журналу' });
      }

      // Проверяем роль пользователя в журнале
      if (!requiredRoles.includes(userAccess.role)) {
        return res.status(403).json({ message: 'Недостаточно прав для выполнения операции' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Ошибка проверки доступа к журналу' });
    }
  };
};

// Middleware для проверки доступа на чтение журнала
export const requireJournalRead = requireJournalAccess(['registrar', 'analyst']);

// Middleware для проверки доступа на запись в журнал
export const requireJournalWrite = requireJournalAccess(['registrar']);

// Middleware для проверки доступа аналитика
export const requireJournalAnalyst = requireJournalAccess(['analyst']);
