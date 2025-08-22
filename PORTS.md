# 🌐 Порты WebRegLog

## 📋 Настройки портов

### Development режим (Docker Compose)
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001  
- **MongoDB**: localhost:27017
- **API документация**: http://localhost:5001/api/docs

### Production режим (с Nginx)
- **Frontend**: http://localhost:80 (через Nginx)
- **Backend API**: http://localhost:80/api (через Nginx)
- **MongoDB**: localhost:27017
- **API документация**: http://localhost:80/api/docs

## 🔧 Конфигурация портов

### Docker Compose
```yaml
# Frontend
frontend:
  ports:
    - "3001:80"  # localhost:3001 → контейнер:80

# Backend  
backend:
  ports:
    - "5001:5000"  # localhost:5001 → контейнер:5000

# MongoDB
mongodb:
  ports:
    - "27017:27017"  # localhost:27017 → контейнер:27017
```

### Переменные окружения
```bash
# Frontend URL для CORS
FRONTEND_URL=http://localhost:3001

# Backend порт внутри контейнера
PORT=5000

# API URL для frontend
REACT_APP_API_URL=http://localhost:5001/api
```

## ⚠️ Важные замечания

1. **Frontend работает на порту 3001** (не 3000)
2. **Backend API доступен на порту 5001** (не 5000)
3. **Внутри контейнеров backend работает на порту 5000**
4. **Frontend внутри контейнера работает на порту 80**

## 🔍 Проверка портов

### Проверка доступности
```bash
# Frontend
curl http://localhost:3001

# Backend API
curl http://localhost:5001/health

# MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Проверка занятости портов
```bash
# Windows
netstat -an | findstr :3001
netstat -an | findstr :5001

# Linux/Mac
lsof -i :3001
lsof -i :5001
```

## 🚨 Решение проблем с портами

### Порт занят
Если порт занят другим процессом:
1. Остановите процесс, использующий порт
2. Или измените порт в `docker-compose.yml`

### Изменение портов
```yaml
# В docker-compose.yml
frontend:
  ports:
    - "3002:80"  # Изменить на 3002

backend:
  ports:
    - "5002:5000"  # Изменить на 5002
```

### Обновление переменных окружения
После изменения портов обновите:
- `FRONTEND_URL` в `.env` файлах
- `REACT_APP_API_URL` в frontend
- CORS настройки в backend
