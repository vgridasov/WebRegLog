import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/webreglog';
    
    await mongoose.connect(mongoUri, {
      // Опции подключения MongoDB
    });

    console.log('✅ Подключение к MongoDB установлено');

    // Обработчики событий подключения
    mongoose.connection.on('error', (error) => {
      console.error('❌ Ошибка подключения к MongoDB:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Отключение от MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔄 Подключение к MongoDB закрыто через прерывание приложения');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    process.exit(1);
  }
};
