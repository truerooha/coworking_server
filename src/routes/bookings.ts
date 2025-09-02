import { Router } from 'express';
import { getDatabase } from '../config/database';
import { COLLECTION_NAME } from '../config/env';

type Booking = {
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  userName: string;  // display name of the person who booked
  createdAt: Date;
  updatedAt: Date;
};

const BOOKINGS_COLLECTION_NAME = 'bookings';

const router = Router();

// Utility: check time overlap for string times in HH:MM when compared lexicographically
function isOverlapping(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// POST /api/bookings - create a booking if no conflicts
router.post('/', async (req, res) => {
  try {
    const { roomId, date, startTime, endTime, userName } = req.body || {};

    if (!roomId || !date || !startTime || !endTime || !userName) {
      return res.status(400).json({ error: 'roomId, date, startTime, endTime, userName are required' });
    }

    if (typeof roomId !== 'string' || typeof date !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string' || typeof userName !== 'string') {
      return res.status(400).json({ error: 'Invalid payload types' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'endTime must be later than startTime' });
    }

    const db = getDatabase();
    const bookingsCollection = db.collection<Booking>(BOOKINGS_COLLECTION_NAME);

    // Ensure indexes for efficient lookups
    await bookingsCollection.createIndex({ roomId: 1, date: 1, startTime: 1, endTime: 1 });

    // Find any overlapping booking for the same room and date
    const existing = await bookingsCollection
      .find({ roomId, date })
      .toArray();

    const conflict = existing.find(b => isOverlapping(startTime, endTime, b.startTime, b.endTime));
    if (conflict) {
      return res.status(409).json({ error: 'Room already booked for this time', bookedBy: conflict.userName });
    }

    const now = new Date();
    const doc: Booking = { roomId, date, startTime, endTime, userName, createdAt: now, updatedAt: now };
    await bookingsCollection.insertOne(doc);

    return res.status(201).json({ success: true, booking: { roomId, date, startTime, endTime, userName } });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// GET /api/bookings/me/upcoming?userName=...
router.get('/me/upcoming', async (req, res) => {
  try {
    const userName = String(req.query.userName || '');
    if (!userName) {
      return res.status(400).json({ error: 'userName is required' });
    }

    const db = getDatabase();
    const bookingsCollection = db.collection<Booking>(BOOKINGS_COLLECTION_NAME);
    const roomsCollection = db.collection(COLLECTION_NAME);

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes()
      .toString()
      .padStart(2, '0')}`; // HH:MM

    // Предстоящие: (date > today) OR (date == today AND endTime > nowTime)
    const filter: any = {
      userName,
      $or: [
        { date: { $gt: today } },
        { date: today, endTime: { $gt: nowTime } },
      ],
    };

    const docs = await bookingsCollection
      .find(filter)
      .sort({ date: 1, startTime: 1 })
      .toArray();

    const roomIds = Array.from(new Set(docs.map(d => d.roomId)));
    const rooms = await roomsCollection
      .find({ id: { $in: roomIds } }, { projection: { id: 1, name: 1 } })
      .toArray();
    const roomIdToName = new Map<string, string>(rooms.map((r: any) => [r.id, r.name]));

    const bookings = docs.map((d: any) => ({
      id: String(d._id),
      roomId: d.roomId,
      roomName: roomIdToName.get(d.roomId) || '',
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      status: 'active' as const,
    }));

    return res.json({ bookings });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


