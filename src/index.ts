import express from 'express';
import cors from 'cors';
import roomsRouter from './routes/rooms';
import authRouter from './routes/auth';
import { PORT, CORS_ORIGIN } from './config/env';

const app = express();

// Middleware
app.use(cors({ 
  origin: CORS_ORIGIN, 
  credentials: true 
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/auth', authRouter);
// app.use('/api/bookings', bookingsRouter);
// app.use('/api/me', meRouter);

// // Error handling middleware
// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error('Error:', err);
  
//   if (err.type === 'entity.parse.failed') {
//     return res.status(400).json({ error: 'Invalid JSON' });
//   }
  
//   res.status(err.status || 500).json({ 
//     error: err.message || 'Internal server error' 
//   });
// });

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});

export default app;
