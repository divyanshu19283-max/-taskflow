import { Router } from 'express';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { createTask, updateTask, deleteTask, getTaskById, getColumnById, moveTask } from '../db/queries.js';

const router = Router();

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

function validatePriority(priority) {
  if (priority !== undefined && priority !== null && !VALID_PRIORITIES.includes(priority)) {
    throw new ApiError(400, `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
}

function loadTaskOr404(taskId) {
  const task = getTaskById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return task;
}

// POST /api/tasks
router.post(
  '/',
  asyncHandler((req, res) => {
    const { title, description, priority, column_id } = req.body ?? {};

    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new ApiError(400, 'Task title is required');
    }
    if (column_id === undefined || column_id === null) {
      throw new ApiError(400, 'column_id is required');
    }
    validatePriority(priority);

    const column = getColumnById(column_id);
    if (!column) {
      throw new ApiError(400, 'Destination column does not exist');
    }

    const task = createTask({
      column_id,
      title: title.trim(),
      description: description ?? null,
      priority: priority ?? 'Medium',
    });
    res.status(201).json(task);
  })
);

// PUT /api/tasks/:taskId
router.put(
  '/:taskId',
  asyncHandler((req, res) => {
    const existing = loadTaskOr404(req.params.taskId);
    const { title, description, priority } = req.body ?? {};

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      throw new ApiError(400, 'Task title is required');
    }
    validatePriority(priority);

    const updated = updateTask(existing.id, {
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description : existing.description,
      priority: priority !== undefined ? priority : existing.priority,
    });
    res.json(updated);
  })
);

// PATCH /api/tasks/:taskId/move
router.patch(
  '/:taskId/move',
  asyncHandler((req, res) => {
    const existing = loadTaskOr404(req.params.taskId);
    const { column_id } = req.body ?? {};

    if (column_id === undefined || column_id === null) {
      throw new ApiError(400, 'column_id is required');
    }

    const column = getColumnById(column_id);
    if (!column) {
      throw new ApiError(400, 'Destination column does not exist');
    }

    const moved = moveTask(existing.id, column_id);
    res.json(moved);
  })
);

// DELETE /api/tasks/:taskId
router.delete(
  '/:taskId',
  asyncHandler((req, res) => {
    loadTaskOr404(req.params.taskId);
    deleteTask(req.params.taskId);
    res.status(204).send();
  })
);

export default router;
