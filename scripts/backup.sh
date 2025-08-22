#!/bin/bash

# Скрипт для создания бэкапов MongoDB
# Использование: ./scripts/backup.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Настройки
BACKUP_DIR="./docker/mongodb/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="webreglog_backup_${TIMESTAMP}"
RETENTION_DAYS=7

log "Начинаем создание бэкапа MongoDB..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен"
    exit 1
fi

# Проверка запущен ли MongoDB контейнер
if ! docker-compose ps mongodb | grep -q "Up"; then
    error "MongoDB контейнер не запущен. Запустите docker-compose up -d"
    exit 1
fi

# Создание директории для бэкапов
mkdir -p "$BACKUP_DIR"

# Создание бэкапа
log "Создаем бэкап базы данных..."
if docker-compose exec -T mongodb mongodump \
    --db webreglog \
    --out "/backup/${BACKUP_NAME}" \
    --gzip; then
    
    log "✅ Бэкап успешно создан: ${BACKUP_NAME}"
else
    error "❌ Ошибка при создании бэкапа"
    exit 1
fi

# Архивирование бэкапа
log "Архивируем бэкап..."
cd "$BACKUP_DIR"
if tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"; then
    log "✅ Бэкап заархивирован: ${BACKUP_NAME}.tar.gz"
    
    # Удаление временной директории
    rm -rf "${BACKUP_NAME}"
    
    # Удаление старых бэкапов
    log "Удаляем бэкапы старше ${RETENTION_DAYS} дней..."
    find . -name "webreglog_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    
    log "🎉 Бэкап завершен успешно!"
    log "Файл: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
    log "Размер: $(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)"
else
    error "❌ Ошибка при архивировании бэкапа"
    exit 1
fi

cd - > /dev/null
