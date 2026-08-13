import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import db from '../src/db/db.js';
import { resetAndSeed } from './testDb.js';

describe('POST /api/tasks', () => {
  let ids;

  beforeEach(() => {
    ids = resetAndSeed();
  });

  it('rejects an empty title with 400', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: '',
      column_id: ids.todoId,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects a whitespace-only title with 400', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: '   ',
      column_id: ids.todoId,
    });

    expect(res.status).toBe(400);
  });

  it('creates a task and defaults priority to Medium', async () => {
    const res = await request(app).post('/api/tasks').send({
      title: 'Write tests',
      column_id: ids.todoId,
    });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Write tests');
    expect(res.body.priority).toBe('Medium');
  });
});

describe('PATCH /api/tasks/:taskId/move', () => {
  let ids;

  beforeEach(() => {
    ids = resetAndSeed();
  });

  it('updates the task column_id and persists it in the database', async () => {
    const created = await request(app).post('/api/tasks').send({
      title: 'Move me',
      column_id: ids.todoId,
    });
    const taskId = created.body.id;

    const moveRes = await request(app).patch(`/api/tasks/${taskId}/move`).send({
      column_id: ids.doneId,
    });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.column_id).toBe(ids.doneId);

    // Verify directly against the database, not just the API response.
    const row = db.prepare('SELECT column_id FROM tasks WHERE id = ?').get(taskId);
    expect(row.column_id).toBe(ids.doneId);
  });

  it('rejects a move to a column that does not exist', async () => {
    const created = await request(app).post('/api/tasks').send({
      title: 'Stay put',
      column_id: ids.todoId,
    });

    const moveRes = await request(app).patch(`/api/tasks/${created.body.id}/move`).send({
      column_id: 999999,
    });

    expect(moveRes.status).toBe(400);
  });
});
