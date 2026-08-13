import { describe, it, expect, beforeEach } from 'vitest';
import db from '../src/db/db.js';
import { getTaskCountsPerColumn, getTasksByPriority, createTask } from '../src/db/queries.js';
import { resetAndSeed } from './testDb.js';

describe('getTaskCountsPerColumn', () => {
  it('counts tasks per column, including empty columns', () => {
    const { boardId, todoId, inProgressId } = resetAndSeed();

    createTask({ column_id: todoId, title: 'Task A', priority: 'High' });
    createTask({ column_id: todoId, title: 'Task B', priority: 'Low' });
    createTask({ column_id: inProgressId, title: 'Task C', priority: 'Medium' });

    const counts = getTaskCountsPerColumn(boardId);
    const byName = Object.fromEntries(counts.map((c) => [c.column_name, c.task_count]));

    expect(byName['To Do']).toBe(2);
    expect(byName['In Progress']).toBe(1);
    expect(byName['Done']).toBe(0); // no tasks created - should still appear via LEFT JOIN
  });
});

describe('getTasksByPriority', () => {
  it('returns only tasks with the given priority, newest first', () => {
    const { boardId, todoId, inProgressId } = resetAndSeed();

    createTask({ column_id: todoId, title: 'Old high task', priority: 'High' });
    createTask({ column_id: inProgressId, title: 'New high task', priority: 'High' });
    createTask({ column_id: todoId, title: 'A low task', priority: 'Low' });

    const highTasks = getTasksByPriority(boardId, 'High');

    expect(highTasks).toHaveLength(2);
    expect(highTasks.every((t) => t.priority === 'High')).toBe(true);
    // Newest first: the second-inserted High task should come first.
    expect(highTasks[0].title).toBe('New high task');
  });
});
