import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import boardsRouter from './routes/boards.js';
import tasksRouter from './routes/tasks.js';
import { errorHandler } from './middleware/errorHandler.js';
import './db/seed.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/boards', boardsRouter);
app.use('/api/tasks', tasksRouter);

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler - must be registered last.
app.use(errorHandler);

// Only start the HTTP server when this file is run directly.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  app.listen(PORT, () => {
    console.log(`TaskFlow API listening on port ${PORT}`);
  });
}

export default app;