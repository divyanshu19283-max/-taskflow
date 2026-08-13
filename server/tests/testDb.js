import db from '../src/db/db.js';

// Wipes all data and inserts one board with three columns (To Do, In Progress,
// Done), returning their ids so tests can reference them directly.
export function resetAndSeed() {
  db.prepare('DELETE FROM tasks').run();
  db.prepare('DELETE FROM columns').run();
  db.prepare('DELETE FROM boards').run();

  const boardId = db.prepare('INSERT INTO boards (name) VALUES (?)').run('Test Board').lastInsertRowid;

  const insertColumn = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)');
  const todoId = insertColumn.run(boardId, 'To Do', 0).lastInsertRowid;
  const inProgressId = insertColumn.run(boardId, 'In Progress', 1).lastInsertRowid;
  const doneId = insertColumn.run(boardId, 'Done', 2).lastInsertRowid;

  return { boardId, todoId, inProgressId, doneId };
}
