import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { connectDatabase } from './config/database';
import { setupSwagger } from './config/swagger';

// Импорт маршрутов
import authRoutes from './routes/auth';
import journalRoutes from './routes/journals';
import recordRoutes from './routes/records';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware безопасности
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Настройка CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // лимит на IP
  message: {
    error: 'Слишком много запросов с этого IP, попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы для загрузок
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/records', recordRoutes);

// Swagger документация
setupSwagger(app);

// Обработка 404 ошибок
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Эндпоинт не найден',
    path: req.originalUrl
  });
});

// Глобальный обработчик ошибок
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Глобальная ошибка:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message
    }));
    return res.status(400).json({
      message: 'Ошибка валидации данных',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      message: `Значение поля ${field} уже существует`
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Недействительный токен'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Токен истек'
    });
  }

  // По умолчанию
  res.status(error.status || 500).json({
    message: error.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    // Подключение к базе данных
    await connectDatabase();
    
    // Создание директории для загрузок
    const uploadsDir = path.join(__dirname, '../uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📖 API документация: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM получен. Завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT получен. Завершение работы...');
  process.exit(0);
});

startServer();
