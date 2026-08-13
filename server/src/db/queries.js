import db from './db.js';

/**
 * This module is the single place where SQL lives. Nothing outside this file
 * should write raw SQL - routes call these functions instead.
 */

// ---------- Boards ----------

export function getBoardById(boardId) {
  return db.prepare('SELECT id, name FROM boards WHERE id = ?').get(boardId);
}

export function getColumnsForBoard(boardId) {
  return db
    .prepare('SELECT id, board_id, name, position FROM columns WHERE board_id = ? ORDER BY position ASC')
    .all(boardId);
}

// ---------- Required SQL query #1 ----------
// Count tasks per column for a given board. Done as a single SQL query (with a
// LEFT JOIN so empty columns still show a count of 0) rather than fetching every
// task and counting in JavaScript.
export function getTaskCountsPerColumn(boardId) {
  return db
    .prepare(
      `SELECT c.id AS column_id, c.name AS column_name, COUNT(t.id) AS task_count
       FROM columns c
       LEFT JOIN tasks t ON t.column_id = c.id
       WHERE c.board_id = ?
       GROUP BY c.id, c.name
       ORDER BY c.position ASC`
    )
    .all(boardId);
}

// ---------- Required SQL query #2 ----------
// Get all tasks for a board with a given priority, newest first.
export function getTasksByPriority(boardId, priority) {
  return db
    .prepare(
      `SELECT t.id, t.column_id, t.title, t.description, t.priority, t.created_at
       FROM tasks t
       JOIN columns c ON c.id = t.column_id
       WHERE c.board_id = ? AND t.priority = ?
       ORDER BY t.created_at DESC, t.id DESC`
    )
    .all(boardId, priority);
}

// ---------- Tasks ----------

export function getTasksForBoard(boardId) {
  return db
    .prepare(
      `SELECT t.id, t.column_id, t.title, t.description, t.priority, t.created_at
       FROM tasks t
       JOIN columns c ON c.id = t.column_id
       WHERE c.board_id = ?
       ORDER BY t.created_at DESC, t.id DESC`
    )
    .all(boardId);
}

export function getTaskById(taskId) {
  return db
    .prepare('SELECT id, column_id, title, description, priority, created_at FROM tasks WHERE id = ?')
    .get(taskId);
}

export function getColumnById(columnId) {
  return db.prepare('SELECT id, board_id, name, position FROM columns WHERE id = ?').get(columnId);
}

export function createTask({ column_id, title, description, priority }) {
  const result = db
    .prepare(
      `INSERT INTO tasks (column_id, title, description, priority)
       VALUES (?, ?, ?, ?)`
    )
    .run(column_id, title, description ?? null, priority ?? 'Medium');
  return getTaskById(result.lastInsertRowid);
}

export function updateTask(taskId, { title, description, priority }) {
  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, priority = ?
     WHERE id = ?`
  ).run(title, description ?? null, priority, taskId);
  return getTaskById(taskId);
}

export function moveTask(taskId, columnId) {
  db.prepare('UPDATE tasks SET column_id = ? WHERE id = ?').run(columnId, taskId);
  return getTaskById(taskId);
}

export function deleteTask(taskId) {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  return result.changes > 0;
}
