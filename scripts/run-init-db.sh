#!/bin/bash

# Скрипт запуска инициализации базы данных WebRegLog для Linux/Mac
# Использование: ./scripts/run-init-db.sh

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

log "🔐 Запуск инициализации базы данных WebRegLog"
log "============================================="
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
log "🚀 Запускаем инициализацию базы данных..."
echo ""

# Запуск инициализации
cd backend
npm run init-db
cd ..

log ""
log "🎉 Инициализация завершена!"
echo ""
log "📋 Теперь вы можете:"
log "   1. Запустить приложение: ./scripts/deploy.sh dev"
log "   2. Или запустить только backend: docker-compose up -d"
echo ""
log "🔐 Войдите в систему с созданными учетными данными"
log "🌐 Frontend: http://localhost:3001"
