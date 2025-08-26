import { z } from 'zod';
import dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config();

// Схема валидации для переменных окружения
const envSchema = z.object({
  // Основные настройки приложения
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  
  // База данных
  DATABASE_URL: z.string().url('DATABASE_URL должен быть валидным URL'),
  
  // JWT токены
  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен содержать минимум 32 символа'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET должен содержать минимум 32 символа'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().url().or(z.literal('*')).default('*'),
  
  // Логирование
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API ключи (опциональные)
  API_KEY: z.string().optional(),
  
  // Redis (опционально)
  REDIS_URL: z.string().url().optional(),
  
  // Email (опционально)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Файлы
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(5 * 1024 * 1024), // 5MB
});

// Тип для валидированных переменных окружения
export type EnvConfig = z.infer<typeof envSchema>;

// Функция для валидации и получения конфигурации
function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path.join('.')).join(', ');
      throw new Error(`Ошибка валидации переменных окружения: ${missingVars}`);
    }
    throw error;
  }
}

// Экспортируем валидированную конфигурацию
export const env = validateEnv();

// Дополнительные утилиты для работы с конфигурацией
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Конфигурация для разных окружений
export const config = {
  app: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment,
    isProduction,
    isTest,
  },
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  redis: env.REDIS_URL ? { url: env.REDIS_URL } : null,
  smtp: env.SMTP_HOST ? {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT!,
    user: env.SMTP_USER!,
    pass: env.SMTP_PASS!,
  } : null,
  upload: {
    dir: env.UPLOAD_DIR,
    maxSize: env.MAX_FILE_SIZE,
  },
} as const;
