import express from 'express';
const router = express.Router();

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

// Mock data generation
const generateMockRooms = (): Room[] => [
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

// In-memory storage for mock data
let mockRooms = generateMockRooms();

// GET /api/rooms - Get all rooms
router.get('/', (req, res) => {
  res.json(mockRooms);
});

// GET /api/rooms/:id - Get specific room
router.get('/:id', (req, res) => {
  const room = mockRooms.find(r => r.id === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json(room);
});

// POST /api/rooms/reset - Reset mock data (for development)
router.post('/reset', (req, res) => {
  mockRooms = generateMockRooms();
  res.json({ message: 'Mock data reset successfully' });
});

export default router;
