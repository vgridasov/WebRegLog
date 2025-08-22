#!/bin/bash

# Скрипт инициализации базы данных WebRegLog для Linux/Mac
# Использование: ./scripts/init-database.sh

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

log "🚀 Инициализация базы данных WebRegLog"
log "====================================="
echo ""

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

# Проверка запущен ли Docker
if ! docker info &> /dev/null; then
    error "Docker не запущен. Запустите Docker и попробуйте снова."
    exit 1
fi

log "✅ Docker запущен"

# Проверка наличия .env файла
if [[ ! -f "docker-comongo.env" ]]; then
    log "📝 Создаем файл docker-comongo.env..."
    cp docker-comongo.env.example docker-comongo.env
    log "✅ Файл docker-comongo.env создан"
    warn "Не забудьте настроить пароли для production!"
    echo ""
fi

# Запуск MongoDB контейнера
log "🔧 Запускаем MongoDB контейнер..."
docker-compose up -d mongodb
log "✅ MongoDB контейнер запущен"

# Ожидание запуска MongoDB
log "⏳ Ожидаем запуска MongoDB (15 секунд)..."
sleep 15

# Проверка здоровья MongoDB
log "🔍 Проверяем здоровье MongoDB..."
max_attempts=10
attempt=0
mongodb_ready=false

while [[ $attempt -lt $max_attempts && "$mongodb_ready" == false ]]; do
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        mongodb_ready=true
        log "✅ MongoDB готов к работе"
    else
        attempt=$((attempt + 1))
        if [[ $attempt -lt $max_attempts ]]; then
            log "⏳ Попытка $attempt из $max_attempts... (5 секунд)"
            sleep 5
        fi
    fi
done

if [[ "$mongodb_ready" == false ]]; then
    error "❌ MongoDB не готов к работе после $max_attempts попыток"
    exit 1
fi

# Проверка наличия Node.js и npm
log "🔍 Проверяем наличие Node.js..."
if ! command -v node &> /dev/null; then
    error "Node.js не установлен. Установите Node.js и попробуйте снова."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "npm не установлен. Установите npm и попробуйте снова."
    exit 1
fi

log "✅ Node.js и npm найдены"

# Установка зависимостей backend
log "📦 Устанавливаем зависимости backend..."
cd backend
npm install
log "✅ Зависимости установлены"

# Сборка backend
log "🔨 Собираем backend..."
npm run build
log "✅ Backend собран"

# Возврат в корневую директорию
cd ..

echo ""
log "🎯 База данных готова к инициализации!"
echo ""
log "📝 Теперь запустите скрипт инициализации:"
log "   cd backend"
log "   npm run init-db"
echo ""
log "🔐 Или используйте готовый скрипт: ./scripts/run-init-db.sh"
echo ""
log "После инициализации запустите приложение: ./scripts/deploy.sh dev"
