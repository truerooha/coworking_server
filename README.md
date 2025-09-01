# Coworking Server

Сервер для приложения бронирования переговорных комнат с аутентификацией через MongoDB.

## 🚀 Запуск

### Локальная разработка
```bash
npm run dev
```

### Продакшн
```bash
npm run build
npm start
```

## 🗄️ База данных

### Переменные окружения
Создайте файл `.env` в папке `server`:

```env
# Server Configuration
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000

# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=coworking
COLLECTION_NAME=rooms
USERS_COLLECTION_NAME=users
```

### Автоматическая инициализация
При первом запуске сервера автоматически:
- Создается коллекция `users`
- Создается индекс по полю `username`
- Добавляется пользователь `true_rooha` с правами администратора

## 🔐 API Endpoints

### Аутентификация

#### POST `/api/auth/check`
Проверка доступа пользователя
```json
{
  "username": "true_rooha"
}
```

**Ответ:**
```json
{
  "allowed": true,
  "isAdmin": true,
  "name": "true_rooha",
  "surname": ""
}
```

#### GET `/api/auth/users`
Получение списка всех пользователей

#### POST `/api/auth/users`
Создание нового пользователя
```json
{
  "username": "new_user",
  "isAdmin": false
}
```

## 📊 Структура данных

### Коллекция `users`
```typescript
interface User {
  username: string;      // Уникальный username
  isAdmin: boolean;      // Права администратора
  createdAt: Date;       // Дата создания
  updatedAt: Date;       // Дата обновления
}
```

## 🔧 Добавление пользователей

### Через API
```bash
curl -X POST http://localhost:4000/api/auth/users \
  -H "Content-Type: application/json" \
  -d '{"username": "jane_smith", "isAdmin": false}'
```

### Через MongoDB напрямую
```javascript
db.users.insertOne({
  username: "jane_smith",
  isAdmin: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🚨 Безопасность

- Все пользователи должны быть предварительно добавлены в базу данных
- Доступ запрещен по умолчанию для неизвестных пользователей
- В случае ошибки базы данных доступ автоматически запрещается
