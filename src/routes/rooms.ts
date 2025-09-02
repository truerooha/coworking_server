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

// GET /api/rooms - Get all rooms with live booking status
router.get('/', async (req, res) => {
  try {
    const rooms = await roomsCollection.find({}).toArray();

    // Дополняем статусами из коллекции бронирований
    const bookingsCollection = db.collection('bookings');

    // Локальная дата YYYY-MM-DD и время HH:MM
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    // Заберём все брони на сегодня, чтобы определить занятость
    const todaysBookings = await bookingsCollection
      .find({ date: today })
      .toArray();

    const roomIdToBookings = new Map<string, any[]>();
    for (const b of todaysBookings) {
      if (!roomIdToBookings.has(b.roomId)) roomIdToBookings.set(b.roomId, []);
      roomIdToBookings.get(b.roomId)!.push(b);
    }

    const debugEnabled = String(req.query.debug || '0') === '1';
    const debugLog: any = {
      serverNowIso: new Date().toISOString(),
      today,
      nowTime,
      timezoneOffsetMin: new Date().getTimezoneOffset(),
      totals: {
        rooms: rooms.length,
        todaysBookings: todaysBookings.length
      },
      rooms: [] as any[]
    };

    const enriched = rooms.map((room: any) => {
      const list = roomIdToBookings.get(room.id) || [];
      const active = list.find(
        (b) => b.startTime <= nowTime && nowTime < b.endTime
      );

      if (debugEnabled) {
        debugLog.rooms.push({
          roomId: room.id,
          roomName: room.name,
          bookingsToday: list
            .map((b: any) => ({ startTime: b.startTime, endTime: b.endTime, userName: b.userName }))
            .sort((a: any, b: any) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0)),
          activeMatch: active
            ? { startTime: active.startTime, endTime: active.endTime, userName: active.userName }
            : null
        });
      }

      if (active) {
        return {
          ...room,
          isOccupied: true,
          currentBooking: {
            user: active.userName,
            startTime: active.startTime,
            endTime: active.endTime,
          },
        };
      }

      return {
        ...room,
        isOccupied: false,
        currentBooking: undefined,
      };
    });

    if (debugEnabled) {
      console.log('[GET /api/rooms] debug:', JSON.stringify(debugLog, null, 2));
      return res.json({ rooms: enriched, debug: debugLog });
    }

    return res.json(enriched);
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
