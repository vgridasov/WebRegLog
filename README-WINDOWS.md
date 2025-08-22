# WebRegLog - Запуск на Windows 11

## 🚀 Быстрый запуск

### Вариант 1: Первый запуск (с инициализацией)
1. **Подготовка базы данных:**
   - Запустите: `.\scripts\init-database.ps1`
   - Затем: `.\scripts\run-init-db.ps1`
   - Следуйте инструкциям для создания администратора
2. **Запуск приложения:**
   - Дважды кликните на `start-windows.bat`
   - Дождитесь завершения запуска (около 30 секунд)
3. Откройте браузер на http://localhost:3001

### Вариант 2: Повторный запуск
1. Дважды кликните на файл `start-windows.bat`
2. Дождитесь завершения запуска (около 30 секунд)
3. Откройте браузер и перейдите на http://localhost:3001

### Вариант 2: Ручной запуск через PowerShell
```powershell
# Клонирование репозитория
git clone <repository-url>
cd WebRegLogs

# Создание .env файла
copy docker-comongo.env.example docker-comongo.env

# Запуск через PowerShell скрипт
.\scripts\deploy.ps1 dev

# Или через Docker Compose напрямую
docker-compose up -d --build
```

## 📋 Требования

- **Windows 11** (также работает на Windows 10)
- **Docker Desktop для Windows** (обязательно!)
- **WSL2** (устанавливается автоматически с Docker Desktop)
- **PowerShell 5.1+** (встроен в Windows 10/11)

## 🔧 Установка Docker Desktop

1. Скачайте Docker Desktop с официального сайта:
   https://www.docker.com/products/docker-desktop/

2. Установите Docker Desktop, следуя инструкциям установщика

3. При первом запуске Docker Desktop автоматически:
   - Установит WSL2
   - Настроит необходимые компоненты
   - Попросит перезагрузить компьютер

4. После перезагрузки запустите Docker Desktop

## 🗄️ Инициализация базы данных

**Важно:** При первом запуске необходимо инициализировать базу данных и создать администратора.

### Шаг 1: Подготовка базы данных
```powershell
.\scripts\init-database.ps1
```
Этот скрипт:
- Запустит MongoDB контейнер
- Установит зависимости backend
- Соберет backend

### Шаг 2: Создание администратора
```powershell
.\scripts\run-init-db.ps1
```
Этот скрипт:
- Запросит данные для создания администратора
- Создаст учетную запись администратора
- Опционально создаст демо-пользователей

**После инициализации** можно использовать `start-windows.bat` для обычного запуска.

## 📁 Структура проекта для Windows

```
WebRegLogs/
├── start-windows.bat          # Быстрый запуск
├── scripts/
│   ├── init-database.ps1     # Подготовка базы данных
│   ├── run-init-db.ps1       # Запуск инициализации
│   ├── deploy.ps1            # PowerShell скрипт развертывания
│   ├── backup.ps1            # PowerShell скрипт бэкапа
│   ├── deploy.sh             # Bash скрипт (для WSL/Linux)
│   └── backup.sh             # Bash скрипт (для WSL/Linux)
├── docker-compose.yml         # Основная конфигурация
└── docker-comongo.env.example # Пример переменных окружения
```

## 🌐 Доступные сервисы

После успешного запуска:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001
- **API документация**: http://localhost:5001/api/docs
- **Health check**: http://localhost:5001/health

## 👥 Демо пользователи

- **Администратор**: admin@webreglog.com / admin123
- **Регистратор**: registrar@webreglog.com / registrar123
- **Аналитик**: analyst@webreglog.com / analyst123

## 📋 Основные команды

### Управление сервисами
```powershell
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Просмотр логов
docker-compose logs -f

# Просмотр статуса
docker-compose ps
```

### PowerShell скрипты
```powershell
# Инициализация базы данных (первый запуск)
.\scripts\init-database.ps1
.\scripts\run-init-db.ps1

# Развертывание в dev режиме
.\scripts\deploy.ps1 dev

# Развертывание в production режиме
.\scripts\deploy.ps1 prod

# Создание бэкапа
.\scripts\backup.ps1
```

### Управление контейнерами
```powershell
# Пересборка и запуск
docker-compose up -d --build

# Удаление всех контейнеров и образов
docker-compose down --rmi all

# Очистка неиспользуемых ресурсов
docker system prune -a
```

## ⚠️ Возможные проблемы и решения

### Проблема: Docker не запускается
**Решение**: 
- Убедитесь, что включена виртуализация в BIOS
- Проверьте, что WSL2 установлен и работает
- Перезапустите Docker Desktop

### Проблема: Порты заняты
**Решение**:
- Измените порты в `docker-compose.yml`
- Или остановите службы, использующие порты 3001, 5001, 27017

### Проблема: Недостаточно памяти
**Решение**:
- Увеличьте лимит памяти для Docker в настройках Docker Desktop
- Рекомендуется минимум 4GB RAM

### Проблема: Медленная работа
**Решение**:
- Убедитесь, что файлы проекта находятся на диске C: или SSD
- Проверьте настройки антивируса (добавьте исключения для Docker)
- Увеличьте лимиты CPU и памяти для Docker

## 🔒 Безопасность

### Для development:
- Используйте значения по умолчанию из `docker-comongo.env.example`

### Для production:
- Обязательно измените `JWT_SECRET`
- Установите сложный `MONGO_ROOT_PASSWORD`
- Настройте `NODE_ENV=production`
- Используйте HTTPS через nginx

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f`
2. Убедитесь, что Docker Desktop запущен
3. Проверьте, что порты не заняты другими службами
4. Перезапустите Docker Desktop

## 🎯 Преимущества Windows версии

- ✅ Автоматическая установка WSL2
- ✅ Нативные PowerShell скрипты
- ✅ Простой batch файл для запуска
- ✅ Полная совместимость с Docker Desktop
- ✅ Автоматическое создание директорий
- ✅ Проверка здоровья сервисов
