import db from './db.js';

/**
 * Wipes existing data and seeds a fresh board with three columns and a handful
 * of example tasks covering all three priorities. Safe to re-run.
 */
function seed() {
  const seedAll = db.transaction(() => {
    db.prepare('DELETE FROM tasks').run();
    db.prepare('DELETE FROM columns').run();
    db.prepare('DELETE FROM boards').run();

    const boardId = db.prepare('INSERT INTO boards (name) VALUES (?)').run('TaskFlow Demo Board')
      .lastInsertRowid;

    const insertColumn = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)');
    const todoId = insertColumn.run(boardId, 'To Do', 0).lastInsertRowid;
    const inProgressId = insertColumn.run(boardId, 'In Progress', 1).lastInsertRowid;
    const doneId = insertColumn.run(boardId, 'Done', 2).lastInsertRowid;

    const insertTask = db.prepare(
      `INSERT INTO tasks (column_id, title, description, priority) VALUES (?, ?, ?, ?)`
    );

    insertTask.run(todoId, 'Design database schema', 'Boards, columns, tasks with foreign keys', 'High');
    insertTask.run(todoId, 'Write API docs', 'Document all REST endpoints in the README', 'Low');
    insertTask.run(todoId, 'Set up CI', '', 'Medium');

    insertTask.run(inProgressId, 'Build task board UI', 'Columns + task cards, responsive layout', 'High');
    insertTask.run(inProgressId, 'Implement move endpoint', 'PATCH /api/tasks/:id/move', 'Medium');

    insertTask.run(doneId, 'Project scaffolding', 'Vite + Express + better-sqlite3 wired up', 'Medium');
    insertTask.run(doneId, 'Initial commit', '', 'Low');

    console.log(`Seeded board ${boardId} with 3 columns and 7 tasks.`);
  });

  seedAll();
}

seed();
