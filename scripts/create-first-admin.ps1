# Автоматический скрипт создания первого администратора WebRegLog для Windows
# Использование: .\scripts\create-first-admin.ps1

# Остановка при ошибке
$ErrorActionPreference = "Stop"

# Функция для логирования
function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Warning {
    param([string]$Message)
    Write-Log "WARNING: $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-Log "ERROR: $Message" "Red"
}

Write-Log "🔐 Автоматическое создание первого администратора WebRegLog"
Write-Log "========================================================="
Write-Log ""

# Проверка наличия backend директории
if (-not (Test-Path "backend")) {
    Write-Error "Директория backend не найдена. Запустите скрипт из корневой папки проекта."
    exit 1
}

# Проверка наличия package.json
if (-not (Test-Path "backend/package.json")) {
    Write-Error "package.json не найден в backend директории."
    exit 1
}

# Проверка наличия node_modules
if (-not (Test-Path "backend/node_modules")) {
    Write-Warning "Зависимости не установлены. Устанавливаем..."
    try {
        Set-Location "backend"
        npm install
        Set-Location ".."
        Write-Log "✅ Зависимости установлены"
    } catch {
        Write-Error "❌ Ошибка при установке зависимостей"
        exit 1
    }
}

# Проверка наличия dist директории
if (-not (Test-Path "backend/dist")) {
    Write-Warning "Backend не собран. Собираем..."
    try {
        Set-Location "backend"
        npm run build
        Set-Location ".."
        Write-Log "✅ Backend собран"
    } catch {
        Write-Error "❌ Ошибка при сборке backend"
        exit 1
    }
}

# Проверка MongoDB
Write-Log "🔍 Проверяем MongoDB..."
try {
    $mongodbStatus = docker-compose ps mongodb 2>$null | Select-String "Up"
    if (-not $mongodbStatus) {
        Write-Warning "MongoDB не запущен. Запускаем..."
        docker-compose up -d mongodb
        Start-Sleep -Seconds 15
    }
    
    # Проверка здоровья
    docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" 2>$null | Out-Null
    Write-Log "✅ MongoDB готов к работе"
} catch {
    Write-Error "❌ MongoDB не готов к работе. Запустите сначала .\scripts\init-database.ps1"
    exit 1
}

Write-Log ""
Write-Log "🚀 Создаем первого администратора..."
Write-Log ""

# Создание временного скрипта инициализации с предустановленными значениями
$tempScriptPath = "backend/temp-init.js"
$tempScriptContent = @"
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
      console.log(\`✅ Создан демо-пользователь: \${demoUser.email} (\${demoUser.role})\`);
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
"@

# Записываем временный скрипт
Set-Content -Path $tempScriptPath -Value $tempScriptContent -Encoding UTF8

# Запуск инициализации
try {
    Set-Location "backend"
    node temp-init.js
    Set-Location ".."
    
    # Удаляем временный файл
    Remove-Item $tempScriptPath -Force
    
    Write-Log ""
    Write-Log "🎉 Администратор создан успешно!"
    Write-Log ""
    Write-Log "📋 Теперь вы можете войти в систему:"
    Write-Log "   Email: admin@webreglog.com"
    Write-Log "   Пароль: admin123"
    Write-Log ""
    Write-Log "🌐 Frontend: http://localhost:3001"
    
} catch {
    Write-Error "❌ Ошибка при создании администратора"
    # Удаляем временный файл в случае ошибки
    if (Test-Path $tempScriptPath) {
        Remove-Item $tempScriptPath -Force
    }
    exit 1
}
