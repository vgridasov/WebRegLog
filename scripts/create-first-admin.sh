#!/bin/bash

# Автоматический скрипт создания первого администратора WebRegLog для Linux/Mac
# Использование: ./scripts/create-first-admin.sh

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

log "🔐 Автоматическое создание первого администратора WebRegLog"
log "========================================================="
echo ""

# Проверка наличия backend директории
if [[ ! -d "backend" ]]; then
    error "Директория backend не найдена. Запустите скрипт из корневой папки проекта."
    exit 1
fi

# Проверка наличия package.json
if [[ ! -f "backend/package.json" ]]; then
    error "package.json не найден в backend директории."
    exit 1
fi

# Проверка наличия node_modules
if [[ ! -d "backend/node_modules" ]]; then
    warn "Зависимости не установлены. Устанавливаем..."
    cd backend
    npm install
    cd ..
    log "✅ Зависимости установлены"
fi

# Проверка наличия dist директории
if [[ ! -d "backend/dist" ]]; then
    warn "Backend не собран. Собираем..."
    cd backend
    npm run build
    cd ..
    log "✅ Backend собран"
fi

# Проверка MongoDB
log "🔍 Проверяем MongoDB..."
mongodb_status=$(docker-compose ps mongodb | grep -c "Up" || echo "0")

if [[ $mongodb_status -eq 0 ]]; then
    warn "MongoDB не запущен. Запускаем..."
    docker-compose up -d mongodb
    sleep 15
fi

# Проверка здоровья
if ! docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    error "❌ MongoDB не готов к работе. Запустите сначала ./scripts/init-database.sh"
    exit 1
fi

log "✅ MongoDB готов к работе"

echo ""
log "🚀 Создаем первого администратора..."
echo ""

# Создание временного скрипта инициализации с предустановленными значениями
temp_script_path="backend/temp-init.js"
cat > "$temp_script_path" << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Подключение к базе данных
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/webreglog?authSource=admin');

// Схема пользователя
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'registrar', 'analyst'], default: 'admin' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Хеширование пароля
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

const User = mongoose.model('User', userSchema);

async function createFirstAdmin() {
  try {
    // Проверяем, есть ли уже пользователи
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('ℹ️  В системе уже есть пользователи. Инициализация не требуется.');
      return;
    }

    // Создаем первого администратора с предустановленными данными
    const adminUser = new User({
      email: 'admin@webreglog.com',
      password: 'admin123',
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Администратор успешно создан!');
    console.log('📋 Данные для входа:');
    console.log('   Email: admin@webreglog.com');
    console.log('   Пароль: admin123');
    console.log('   Роль: Администратор');

    // Создаем демо-пользователей
    const demoUsers = [
      {
        email: 'registrar@webreglog.com',
        password: 'registrar123',
        firstName: 'Регистратор',
        lastName: 'Демо',
        role: 'registrar'
      },
      {
        email: 'analyst@webreglog.com',
        password: 'analyst123',
        firstName: 'Аналитик',
        lastName: 'Демо',
        role: 'analyst'
      }
    ];

    for (const demoUser of demoUsers) {
      const user = new User(demoUser);
      await user.save();
      console.log(`✅ Создан демо-пользователь: ${demoUser.email} (${demoUser.role})`);
    }

    console.log('');
    console.log('🎭 Демо-пользователи:');
    console.log('   Регистратор: registrar@webreglog.com / registrar123');
    console.log('   Аналитик: analyst@webreglog.com / analyst123');

  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

createFirstAdmin();
EOF

# Запуск инициализации
cd backend
node temp-init.js
cd ..

# Удаляем временный файл
rm -f "$temp_script_path"

log ""
log "🎉 Администратор создан успешно!"
echo ""
log "📋 Теперь вы можете войти в систему:"
log "   Email: admin@webreglog.com"
log "   Пароль: admin123"
echo ""
log "🌐 Frontend: http://localhost:3001"
