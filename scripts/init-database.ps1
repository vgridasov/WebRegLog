# Скрипт инициализации базы данных WebRegLog для Windows
# Использование: .\scripts\init-database.ps1

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

Write-Log "🚀 Инициализация базы данных WebRegLog"
Write-Log "====================================="
Write-Log ""

# Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker не установлен. Установите Docker Desktop для Windows и попробуйте снова."
    exit 1
}

# Проверка запущен ли Docker
try {
    docker info > $null 2>&1
    Write-Log "✅ Docker запущен"
} catch {
    Write-Error "Docker не запущен. Запустите Docker Desktop и попробуйте снова."
    exit 1
}

# Проверка наличия .env файла
if (-not (Test-Path "docker-comongo.env")) {
    Write-Log "📝 Создаем файл docker-comongo.env..."
    Copy-Item "docker-comongo.env.example" "docker-comongo.env"
    Write-Log "✅ Файл docker-comongo.env создан"
    Write-Warning "Не забудьте настроить пароли для production!"
    Write-Log ""
}

# Запуск MongoDB контейнера
Write-Log "🔧 Запускаем MongoDB контейнер..."
try {
    docker-compose up -d mongodb
    Write-Log "✅ MongoDB контейнер запущен"
} catch {
    Write-Error "❌ Ошибка при запуске MongoDB контейнера"
    exit 1
}

# Ожидание запуска MongoDB
Write-Log "⏳ Ожидаем запуска MongoDB (15 секунд)..."
Start-Sleep -Seconds 15

# Проверка здоровья MongoDB
Write-Log "🔍 Проверяем здоровье MongoDB..."
try {
    $maxAttempts = 10
    $attempt = 0
    $mongodbReady = $false
    
    while ($attempt -lt $maxAttempts -and -not $mongodbReady) {
        try {
            docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" 2>$null | Out-Null
            $mongodbReady = $true
            Write-Log "✅ MongoDB готов к работе"
        } catch {
            $attempt++
            if ($attempt -lt $maxAttempts) {
                Write-Log "⏳ Попытка $attempt из $maxAttempts... (5 секунд)"
                Start-Sleep -Seconds 5
            }
        }
    }
    
    if (-not $mongodbReady) {
        Write-Error "❌ MongoDB не готов к работе после $maxAttempts попыток"
        exit 1
    }
} catch {
    Write-Error "❌ Ошибка при проверке MongoDB"
    exit 1
}

# Проверка наличия Node.js и npm
Write-Log "🔍 Проверяем наличие Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js не установлен. Установите Node.js и попробуйте снова."
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm не установлен. Установите npm и попробуйте снова."
    exit 1
}

Write-Log "✅ Node.js и npm найдены"

# Установка зависимостей backend
Write-Log "📦 Устанавливаем зависимости backend..."
try {
    Set-Location "backend"
    npm install
    Write-Log "✅ Зависимости установлены"
} catch {
    Write-Error "❌ Ошибка при установке зависимостей"
    exit 1
}

# Сборка backend
Write-Log "🔨 Собираем backend..."
try {
    npm run build
    Write-Log "✅ Backend собран"
} catch {
    Write-Error "❌ Ошибка при сборке backend"
    exit 1
}

# Возврат в корневую директорию
Set-Location ".."

Write-Log ""
Write-Log "🎯 База данных готова к инициализации!"
Write-Log ""
Write-Log "✅ Подготовка завершена успешно!"
Write-Log "Теперь можно создавать администратора"
