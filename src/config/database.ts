import { MongoClient, Db } from 'mongodb';
import { MONGODB_URI, DB_NAME, USERS_COLLECTION_NAME } from './env';

let client: MongoClient;
let db: Db;

export interface User {
  username: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Подключение к MongoDB
export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB');
    
    // Инициализируем коллекцию users
    await initializeUsersCollection();
    
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Получение подключения к базе данных
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

// Инициализация коллекции users
async function initializeUsersCollection(): Promise<void> {
  try {
    const db = getDatabase();
    const usersCollection = db.collection<User>(USERS_COLLECTION_NAME);
    
    // Создаем индекс по username для быстрого поиска
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    
    // Проверяем, есть ли уже пользователи в коллекции
    const userCount = await usersCollection.countDocuments();
    
    if (userCount === 0) {
      // Создаем предзаполненного пользователя true_rooha
      const defaultUser: User = {
        username: 'true_rooha',
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(defaultUser);
      console.log('✅ Created default user: true_rooha (admin)');
    } else {
      console.log(`ℹ️ Users collection already has ${userCount} users`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize users collection:', error);
    throw error;
  }
}

// Закрытие подключения к базе данных
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});
