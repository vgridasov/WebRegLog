@echo off
chcp 65001 >nul
echo ========================================
echo    WebRegLog - Инициализация БД
echo ========================================
echo.

echo 🔐 Первый запуск WebRegLog
echo.
echo 📋 Для инициализации базы данных выполните:
echo.
echo 1. PowerShell скрипт подготовки:
echo    .\scripts\init-database.ps1
echo.
echo 2. PowerShell скрипт создания администратора:
echo    .\scripts\run-init-db.ps1
echo.
echo 3. После инициализации запустите:
echo    .\start-windows.bat
echo.
echo ⚠️  Инициализация требуется только при первом запуске!
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
