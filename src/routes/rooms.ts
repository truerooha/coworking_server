import express from 'express';
import { MongoClient, Db, Collection } from 'mongodb';
import { MONGODB_URI, DB_NAME, COLLECTION_NAME } from '../config/env';

const router = express.Router();

// MongoDB connection

let db: Db;
let roomsCollection: Collection;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    roomsCollection = db.collection(COLLECTION_NAME);
    console.log('Connected to MongoDB');
    
    // Initialize collection with mock data if empty
    const count = await roomsCollection.countDocuments();
    if (count === 0) {
      await initializeRoomsCollection();
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

// Initialize rooms collection with mock data
async function initializeRoomsCollection() {
  const mockRooms = [
    {
      id: '1',
      name: 'Конференц-зал',
      image: 'https://i.postimg.cc/WtpDfQPt/room.jpg',
      capacity: 10,
      description: 'Большой конференц-зал с видеоконференцсвязью',
      isOccupied: false,
    },
    {
      id: '2', 
      name: 'Zoom room 1',
      image: 'https://i.postimg.cc/8JNFGYJK/zoom1.jpg',
      capacity: 1,
      description: 'Уютная комната для видеозвонков',
      isOccupied: true,
      currentBooking: {
        user: 'Иван Петров',
        startTime: '14:00',
        endTime: '15:30'
      }
    },
    {
      id: '3',
      name: 'Zoom room 2',
      image: 'https://i.postimg.cc/8JNFGYJK/zoom1.jpg',
      capacity: 1,
      description: 'Уютная комната для видеозвонков',
      isOccupied: false,
    }
  ];

  await roomsCollection.insertMany(mockRooms);
  console.log('Rooms collection initialized with mock data');
}

// временно прямо тут. В дальнейшем будет в отдельном файле types.ts
type Room = {
    id: string;
    name: string;
    image: string;
    capacity: number;
    description: string;
    isOccupied: boolean;
    currentBooking?: {
      user: string;
      startTime: string;
      endTime: string;
    };
  };

// Initialize MongoDB connection
connectToMongoDB();

// GET /api/rooms - Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await roomsCollection.find({}).toArray();
    return res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// GET /api/rooms/:id - Get specific room
router.get('/:id', async (req, res) => {
  try {
    const room = await roomsCollection.findOne({ id: req.params.id });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// POST /api/rooms/reset - Reset mock data (for development)
router.post('/reset', async (req, res) => {
  try {
    await roomsCollection.deleteMany({});
    await initializeRoomsCollection();
    return res.json({ message: 'Mock data reset successfully' });
  } catch (error) {
    console.error('Error resetting data:', error);
    return res.status(500).json({ error: 'Failed to reset data' });
  }
});

export default router;
