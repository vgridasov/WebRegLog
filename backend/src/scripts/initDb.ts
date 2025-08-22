import mongoose from 'mongoose';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { connectDatabase } from '../config/database';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Создаем интерфейс для чтения ввода пользователя
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Функция для запроса ввода пользователя
const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Функция для скрытого ввода пароля
const questionPassword = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (password) => {
      resolve(password);
    });
  });
};

// Функция для создания первого администратора
const createFirstAdmin = async () => {
  try {
    console.log('🔐 Создание первого администратора WebRegLog');
    console.log('==========================================');
    console.log('');

    // Проверяем, есть ли уже пользователи в системе
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log('ℹ️  В системе уже есть пользователи. Инициализация не требуется.');
      return;
    }

    console.log('📝 Введите данные для создания администратора:');
    console.log('');

    // Запрашиваем данные администратора
    const firstName = await question('Имя: ');
    const lastName = await question('Фамилия: ');
    const email = await question('Email: ');
    
    // Проверяем корректность email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Неверный формат email!');
      return;
    }

    // Проверяем, не занят ли email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ Пользователь с таким email уже существует!');
      return;
    }

    // Запрашиваем пароль
    const password = await questionPassword('Пароль (минимум 6 символов): ');
    
    if (password.length < 6) {
      console.log('❌ Пароль должен содержать минимум 6 символов!');
      return;
    }

    // Подтверждение пароля
    const confirmPassword = await questionPassword('Подтвердите пароль: ');
    
    if (password !== confirmPassword) {
      console.log('❌ Пароли не совпадают!');
      return;
    }

    console.log('');
    console.log('⏳ Создаю администратора...');

    // Создаем пользователя-администратора
    const adminUser = new User({
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'admin',
      isActive: true
    });

    await adminUser.save();

    console.log('');
    console.log('✅ Администратор успешно создан!');
    console.log('');
    console.log('📋 Данные для входа:');
    console.log(`   Email: ${email}`);
    console.log(`   Роль: Администратор`);
    console.log('');
    console.log('🔐 Теперь вы можете войти в систему с этими данными');
    console.log('🌐 Frontend: http://localhost:3001');
    console.log('📖 API: http://localhost:5001/api/docs');

  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
  } finally {
    rl.close();
  }
};

// Функция для создания демо-пользователей (опционально)
const createDemoUsers = async () => {
  try {
    console.log('');
    console.log('🎭 Создание демо-пользователей...');

    const demoUsers = [
      {
        email: 'registrar@webreglog.com',
        password: 'registrar123',
        firstName: 'Регистратор',
        lastName: 'Демо',
        role: 'registrar' as const
      },
      {
        email: 'analyst@webreglog.com',
        password: 'analyst123',
        firstName: 'Аналитик',
        lastName: 'Демо',
        role: 'analyst' as const
      }
    ];

    for (const demoUser of demoUsers) {
      const existingUser = await User.findOne({ email: demoUser.email });
      if (!existingUser) {
        const user = new User(demoUser);
        await user.save();
        console.log(`✅ Создан демо-пользователь: ${demoUser.email} (${demoUser.role})`);
      } else {
        console.log(`ℹ️  Демо-пользователь уже существует: ${demoUser.email}`);
      }
    }

    console.log('');
    console.log('🎭 Демо-пользователи:');
    console.log('   Регистратор: registrar@webreglog.com / registrar123');
    console.log('   Аналитик: analyst@webreglog.com / analyst123');

  } catch (error) {
    console.error('❌ Ошибка при создании демо-пользователей:', error);
  }
};

// Основная функция
const main = async () => {
  try {
    console.log('🚀 Инициализация базы данных WebRegLog');
    console.log('=====================================');
    console.log('');

    // Подключаемся к базе данных
    await connectDatabase();
    console.log('✅ Подключение к базе данных установлено');
    console.log('');

    // Создаем первого администратора
    await createFirstAdmin();

    // Спрашиваем, нужно ли создать демо-пользователей
    const createDemo = await question('Создать демо-пользователей? (y/n): ');
    
    if (createDemo.toLowerCase() === 'y' || createDemo.toLowerCase() === 'yes') {
      await createDemoUsers();
    }

    console.log('');
    console.log('🎉 Инициализация завершена!');
    console.log('Теперь вы можете запустить приложение.');

  } catch (error) {
    console.error('❌ Ошибка инициализации:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Запускаем скрипт
main();
