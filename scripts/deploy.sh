#!/bin/bash

# Скрипт автоматического развертывания WebRegLog
# Использование: ./scripts/deploy.sh [dev|prod]

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

# Проверка аргументов
ENVIRONMENT=${1:-dev}
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    error "Неверный аргумент. Используйте 'dev' или 'prod'"
    exit 1
fi

log "Начинаем развертывание WebRegLog в режиме: $ENVIRONMENT"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

# Проверка наличия Docker Compose (поддержка обеих версий)
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

log "Используем команду: $COMPOSE_CMD"

# Проверка наличия .env файлов
if [[ "$ENVIRONMENT" == "prod" ]]; then
    if [[ ! -f "docker-comongo.env" ]]; then
        error "Файл docker-comongo.env не найден. Создайте его с production настройками."
        exit 1
    fi
    
    # Проверка критических переменных
    source docker-comongo.env
    if [[ -z "$JWT_SECRET" || "$JWT_SECRET" == "webreglog-jwt-secret-key-2024-production-change-this" ]]; then
        error "JWT_SECRET не настроен или использует значение по умолчанию!"
        exit 1
    fi
    
    if [[ -z "$MONGO_ROOT_PASSWORD" || "$MONGO_ROOT_PASSWORD" == "password123" ]]; then
        error "MONGO_ROOT_PASSWORD не настроен или использует значение по умолчанию!"
        exit 1
    fi
fi

# Остановка существующих контейнеров
log "Останавливаем существующие контейнеры..."
$COMPOSE_CMD down

# Удаление старых образов (только для production)
if [[ "$ENVIRONMENT" == "prod" ]]; then
    log "Удаляем старые образы..."
    $COMPOSE_CMD down --rmi all
fi

# Создание необходимых директорий
log "Создаем необходимые директории..."
mkdir -p backend/uploads
mkdir -p docker/mongodb/data
mkdir -p docker/mongodb/backup
mkdir -p docker/nginx/ssl

# Запуск сервисов
if [[ "$ENVIRONMENT" == "prod" ]]; then
    log "Запускаем production окружение..."
    $COMPOSE_CMD -f docker-compose.yml -f docker-compose.prod.yml up -d --build
else
    log "Запускаем development окружение..."
    $COMPOSE_CMD up -d --build
fi

# Ожидание запуска сервисов
log "Ожидаем запуска сервисов..."
sleep 30

# Проверка здоровья сервисов
log "Проверяем здоровье сервисов..."

# Проверка MongoDB
if $COMPOSE_CMD exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log "✅ MongoDB запущен и работает"
else
    error "❌ MongoDB не отвечает"
    exit 1
fi

# Проверка Backend
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    log "✅ Backend API запущен и работает"
else
    error "❌ Backend API не отвечает"
    exit 1
fi

# Проверка Frontend
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    log "✅ Frontend запущен и работает"
else
    error "❌ Frontend не отвечает"
fi

# Проверка Nginx (только для production)
if [[ "$ENVIRONMENT" == "prod" ]]; then
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log "✅ Nginx запущен и работает"
    else
        error "❌ Nginx не отвечает"
    fi
fi

log "🎉 Развертывание завершено успешно!"
log ""
log "Доступные сервисы:"
log "  - Frontend: http://localhost:3001"
log "  - Backend API: http://localhost:5001"
log "  - API документация: http://localhost:5001/api/docs"
log "  - Health check: http://localhost:5001/health"

if [[ "$ENVIRONMENT" == "prod" ]]; then
    log "  - Nginx: http://localhost:80"
fi

log ""
log "Демо пользователи:"
log "  - Администратор: admin@webreglog.com / admin123"
log "  - Регистратор: registrar@webreglog.com / registrar123"
log "  - Аналитик: analyst@webreglog.com / analyst123"
log ""
log "Для просмотра логов используйте: $COMPOSE_CMD logs -f"
log "Для остановки: $COMPOSE_CMD down"
