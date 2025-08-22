# Скрипт автоматического развертывания WebRegLog для Windows
# Использование: .\scripts\deploy.ps1 [dev|prod]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev"
)

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

Write-Log "Начинаем развертывание WebRegLog в режиме: $Environment"

# Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker не установлен. Установите Docker Desktop для Windows и попробуйте снова."
    exit 1
}

# Проверка наличия Docker Compose
$composeCmd = $null
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $composeCmd = "docker-compose"
} elseif (docker compose version 2>$null) {
    $composeCmd = "docker compose"
} else {
    Write-Error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
}

Write-Log "Используем команду: $composeCmd"

# Проверка наличия .env файлов
if ($Environment -eq "prod") {
    if (-not (Test-Path "docker-comongo.env")) {
        Write-Error "Файл docker-comongo.env не найден. Создайте его с production настройками."
        exit 1
    }
    
    # Проверка критических переменных
    Get-Content "docker-comongo.env" | ForEach-Object {
        if ($_ -match "^JWT_SECRET=") {
            $jwtSecret = $_.Split("=")[1]
            if ([string]::IsNullOrEmpty($jwtSecret) -or $jwtSecret -eq "webreglog-jwt-secret-key-2024-production-change-this") {
                Write-Error "JWT_SECRET не настроен или использует значение по умолчанию!"
                exit 1
            }
        }
        if ($_ -match "^MONGO_ROOT_PASSWORD=") {
            $mongoPassword = $_.Split("=")[1]
            if ([string]::IsNullOrEmpty($mongoPassword) -or $mongoPassword -eq "password123") {
                Write-Error "MONGO_ROOT_PASSWORD не настроен или использует значение по умолчанию!"
                exit 1
            }
        }
    }
}

# Остановка существующих контейнеров
Write-Log "Останавливаем существующие контейнеры..."
& $composeCmd down

# Удаление старых образов (только для production)
if ($Environment -eq "prod") {
    Write-Log "Удаляем старые образы..."
    & $composeCmd down --rmi all
}

# Создание необходимых директорий
Write-Log "Создаем необходимые директории..."
New-Item -ItemType Directory -Force -Path "backend/uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "docker/mongodb/data" | Out-Null
New-Item -ItemType Directory -Force -Path "docker/mongodb/backup" | Out-Null
New-Item -ItemType Directory -Force -Path "docker/nginx/ssl" | Out-Null

# Запуск сервисов
if ($Environment -eq "prod") {
    Write-Log "Запускаем production окружение..."
    & $composeCmd -f docker-compose.yml -f docker-compose.prod.yml up -d --build
} else {
    Write-Log "Запускаем development окружение..."
    & $composeCmd up -d --build
}

# Ожидание запуска сервисов
Write-Log "Ожидаем запуска сервисов..."
Start-Sleep -Seconds 30

# Проверка здоровья сервисов
Write-Log "Проверяем здоровье сервисов..."

# Проверка MongoDB
try {
    & $composeCmd exec -T mongodb mongosh --eval "db.adminCommand('ping')" 2>$null | Out-Null
    Write-Log "✅ MongoDB запущен и работает"
} catch {
    Write-Error "❌ MongoDB не отвечает"
    exit 1
}

# Проверка Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Log "✅ Backend API запущен и работает"
    }
} catch {
    Write-Error "❌ Backend API не отвечает"
    exit 1
}

# Проверка Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Log "✅ Frontend запущен и работает"
    }
} catch {
    Write-Error "❌ Frontend не отвечает"
}

# Проверка Nginx (только для production)
if ($Environment -eq "prod") {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:80" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ Nginx запущен и работает"
        }
    } catch {
        Write-Error "❌ Nginx не отвечает"
    }
}

Write-Log "🎉 Развертывание завершено успешно!"
Write-Log ""
Write-Log "Доступные сервисы:"
Write-Log "  - Frontend: http://localhost:3001"
Write-Log "  - Backend API: http://localhost:5001"
Write-Log "  - API документация: http://localhost:5001/api/docs"
Write-Log "  - Health check: http://localhost:5001/health"

if ($Environment -eq "prod") {
    Write-Log "  - Nginx: http://localhost:80"
}

Write-Log ""
Write-Log "Демо пользователи:"
Write-Log "  - Администратор: admin@webreglog.com / admin123"
Write-Log "  - Регистратор: registrar@webreglog.com / registrar123"
Write-Log "  - Аналитик: analyst@webreglog.com / analyst123"
Write-Log ""
Write-Log "Для просмотра логов используйте: $composeCmd logs -f"
Write-Log "Для остановки: $composeCmd down"
