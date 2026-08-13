import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import boardsRouter from './routes/boards.js';
import tasksRouter from './routes/tasks.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/boards', boardsRouter);
app.use('/api/tasks', tasksRouter);

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler - must be registered last.
app.use(errorHandler);

// Only start the HTTP server when this file is run directly (`node src/index.js`).
// Tests import `app` via supertest, which spins up its own ephemeral server -
// without this guard, importing this module in a test would also try to bind
// the real port, causing EADDRINUSE on the second test file.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(PORT, () => {
    console.log(`TaskFlow API listening on http://localhost:${PORT}`);
  });
}

export default app;
