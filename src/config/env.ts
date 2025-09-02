import { config as loadDotEnv } from 'dotenv';

// Загружаем локальные переменные окружения из .env, если они есть.
// На Railway переменные уже присутствуют в process.env, и dotenv их не перезапишет.
loadDotEnv();

export const NODE_ENV = process.env.NODE_ENV || 'development';

// Сервер
export const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Mongo
export const MONGODB_URI = process.env.MONGO_URL || 'mongodb://localhost:27017';
export const DB_NAME = process.env.DB_NAME || 'coworking';
export const COLLECTION_NAME = process.env.COLLECTION_NAME || 'rooms';
export const USERS_COLLECTION_NAME = 'users';
export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Europe/Moscow';


