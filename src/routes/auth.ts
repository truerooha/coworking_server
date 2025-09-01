import { Router } from 'express';
import { getDatabase } from '../config/database';
import type { User } from '../config/database';
import { USERS_COLLECTION_NAME } from '../config/env';

const router = Router();

router.post('/check', async (req, res) => {
  try {
    const usernameRaw: unknown = req.body?.username;
    const username = typeof usernameRaw === 'string' ? usernameRaw : '';

    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required',
        allowed: false,
        isAdmin: false
      });
    }

    // Получаем подключение к базе данных
    const db = getDatabase();
    const usersCollection = db.collection<User>(USERS_COLLECTION_NAME);

    // Ищем пользователя в базе данных
    const user = await usersCollection.findOne({ username });

    if (!user) {
      // Пользователь не найден - доступ запрещен
      return res.json({
        allowed: false,
        isAdmin: false
      });
    }

    // Пользователь найден - возвращаем его права
    return res.json({
      allowed: true,
      isAdmin: user.isAdmin,
      name: username, // Можно добавить дополнительные поля если нужно
      surname: ''
    });

  } catch (error) {
    console.error('❌ Error in auth check:', error);
    
    // В случае ошибки базы данных - запрещаем доступ
    return res.status(500).json({
      error: 'Internal server error',
      allowed: false,
      isAdmin: false
    });
  }
});

// Дополнительный endpoint для получения всех пользователей (только для админов)
router.get('/users', async (req, res) => {
  try {
    const db = getDatabase();
    const usersCollection = db.collection<User>(USERS_COLLECTION_NAME);
    
    const users = await usersCollection.find({}, { 
      projection: { 
        username: 1, 
        isAdmin: 1, 
        createdAt: 1 
      } 
    }).toArray();
    
    return res.json({ users });
  } catch (error) {
    console.error('❌ Error getting users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint для добавления нового пользователя (только для админов)
router.post('/users', async (req, res) => {
  try {
    const { username, isAdmin = false } = req.body;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required and must be a string' });
    }
    
    const db = getDatabase();
    const usersCollection = db.collection<User>(USERS_COLLECTION_NAME);
    
    // Проверяем, не существует ли уже пользователь с таким username
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this username already exists' });
    }
    
    // Создаем нового пользователя
    const newUser: User = {
      username,
      isAdmin: Boolean(isAdmin),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await usersCollection.insertOne(newUser);
    
    console.log(`✅ Created new user: ${username} (admin: ${isAdmin})`);
    
    return res.status(201).json({ 
      message: 'User created successfully',
      user: { username, isAdmin: newUser.isAdmin }
    });
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


