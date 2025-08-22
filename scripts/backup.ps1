# Скрипт для создания бэкапов MongoDB для Windows
# Использование: .\scripts\backup.ps1

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

# Настройки
$BackupDir = ".\docker\mongodb\backup"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "webreglog_backup_$Timestamp"
$RetentionDays = 7

Write-Log "Начинаем создание бэкапа MongoDB..."

# Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker не установлен"
    exit 1
}

# Проверка запущен ли MongoDB контейнер
try {
    $mongodbStatus = docker-compose ps mongodb 2>$null | Select-String "Up"
    if (-not $mongodbStatus) {
        Write-Error "MongoDB контейнер не запущен. Запустите docker-compose up -d"
        exit 1
    }
} catch {
    Write-Error "Ошибка при проверке статуса MongoDB контейнера"
    exit 1
}

# Создание директории для бэкапов
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

# Создание бэкапа
Write-Log "Создаем бэкап базы данных..."
try {
    docker-compose exec -T mongodb mongodump --db webreglog --out "/backup/$BackupName" --gzip
    Write-Log "✅ Бэкап успешно создан: $BackupName"
} catch {
    Write-Error "❌ Ошибка при создании бэкапа"
    exit 1
}

# Архивирование бэкапа
Write-Log "Архивируем бэкап..."
try {
    # Используем PowerShell Compress-Archive вместо tar
    $backupPath = Join-Path $BackupDir $BackupName
    $archivePath = Join-Path $BackupDir "$BackupName.zip"
    
    Compress-Archive -Path $backupPath -DestinationPath $archivePath -Force
    
    Write-Log "✅ Бэкап заархивирован: $BackupName.zip"
    
    # Удаление временной директории
    Remove-Item -Path $backupPath -Recurse -Force
    
    # Удаление старых бэкапов
    Write-Log "Удаляем бэкапы старше $RetentionDays дней..."
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "webreglog_backup_*.zip" | 
        Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
        Remove-Item -Force
    
    $archiveSize = (Get-Item $archivePath).Length
    $sizeInMB = [math]::Round($archiveSize / 1MB, 2)
    
    Write-Log "🎉 Бэкап завершен успешно!"
    Write-Log "Файл: $archivePath"
    Write-Log "Размер: $sizeInMB MB"
    
} catch {
    Write-Error "❌ Ошибка при архивировании бэкапа"
    exit 1
}
