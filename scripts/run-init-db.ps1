# Скрипт запуска инициализации базы данных WebRegLog для Windows
# Использование: .\scripts\run-init-db.ps1

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

Write-Log "🔐 Запуск инициализации базы данных WebRegLog"
Write-Log "============================================="
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
Write-Log "🚀 Запускаем инициализацию базы данных..."
Write-Log ""

# Запуск инициализации
try {
    Set-Location "backend"
    npm run init-db
    Set-Location ".."
} catch {
    Write-Error "❌ Ошибка при инициализации базы данных"
    exit 1
}

Write-Log ""
Write-Log "🎉 Инициализация завершена!"
Write-Log ""
Write-Log "📋 Теперь вы можете:"
Write-Log "   1. Запустить приложение: .\start-windows.bat"
Write-Log "   2. Или запустить только backend: docker-compose up -d"
Write-Log ""
Write-Log "🔐 Войдите в систему с созданными учетными данными"
Write-Log "🌐 Frontend: http://localhost:3001"
