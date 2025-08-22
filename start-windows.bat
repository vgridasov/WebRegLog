@echo off
chcp 65001 >nul
echo ========================================
echo    WebRegLog - Запуск для Windows
echo ========================================
echo.

REM Проверка наличия Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker не установлен!
    echo Установите Docker Desktop для Windows
    echo https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM Проверка запущен ли Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker не запущен!
    echo Запустите Docker Desktop и попробуйте снова
    pause
    exit /b 1
)

echo ✅ Docker найден и запущен
echo.

REM Создание .env файла если не существует
if not exist "docker-comongo.env" (
    echo 📝 Создаем файл docker-comongo.env...
    copy "docker-comongo.env.example" "docker-comongo.env"
    echo ✅ Файл docker-comongo.env создан
    echo ⚠️  Не забудьте настроить пароли для production!
    echo.
)

REM Проверка инициализации базы данных
echo 🔍 Проверяем инициализацию базы данных...
docker-compose exec -T mongodb mongosh --eval "db.users.countDocuments()" 2>nul | findstr /C:"0" >nul
if %errorlevel% equ 0 (
    echo ⚠️  База данных не инициализирована!
    echo.
    echo 🔐 Запускаем автоматическую инициализацию...
    echo.
    
    REM Запуск инициализации
    echo 📋 Шаг 1: Подготовка базы данных...
    powershell -ExecutionPolicy Bypass -File ".\scripts\init-database.ps1"
    if %errorlevel% neq 0 (
        echo ❌ Ошибка при подготовке базы данных
        pause
        exit /b 1
    )
    
    echo.
    echo 📋 Шаг 2: Создание администратора...
    powershell -ExecutionPolicy Bypass -File ".\scripts\create-first-admin.ps1"
    if %errorlevel% neq 0 (
        echo ❌ Ошибка при создании администратора
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Инициализация завершена!
    echo.
)
echo ✅ База данных готова к работе
echo.

REM Создание необходимых директорий
echo 📁 Создаем необходимые директории...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "docker\mongodb\data" mkdir "docker\mongodb\data"
if not exist "docker\mongodb\backup" mkdir "docker\mongodb\backup"
if not exist "docker\nginx\ssl" mkdir "docker\nginx\ssl"

echo ✅ Директории созданы
echo.

REM Запуск сервисов
echo 🚀 Запускаем WebRegLog...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Ошибка при запуске сервисов
    pause
    exit /b 1
)

echo.
echo ⏳ Ожидаем запуска сервисов (30 секунд)...
timeout /t 30 /nobreak >nul

echo.
echo ========================================
echo           Запуск завершен!
echo ========================================
echo.
echo 🌐 Доступные сервисы:
echo    Frontend: http://localhost:3001
echo    Backend API: http://localhost:5001
echo    API документация: http://localhost:5001/api/docs
echo.
echo 👥 Созданные пользователи:
echo    Администратор: admin@webreglog.com / admin123
echo    Регистратор: registrar@webreglog.com / registrar123
echo    Аналитик: analyst@webreglog.com / analyst123
echo.
echo 📋 Полезные команды:
echo    Просмотр логов: docker-compose logs -f
echo    Остановка: docker-compose down
echo    Перезапуск: docker-compose restart
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
