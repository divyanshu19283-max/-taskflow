import { Router } from 'express';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import {
  getBoardById,
  getColumnsForBoard,
  getTasksForBoard,
  getTasksByPriority,
  getTaskCountsPerColumn,
} from '../db/queries.js';

const router = Router();

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

function loadBoardOr404(boardId) {
  const board = getBoardById(boardId);
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  return board;
}

// GET /api/boards/:boardId - board details plus its columns
router.get(
  '/:boardId',
  asyncHandler((req, res) => {
    const board = loadBoardOr404(req.params.boardId);
    const columns = getColumnsForBoard(board.id);
    res.json({ ...board, columns });
  })
);

// GET /api/boards/:boardId/tasks - all tasks for the board.
// Supports ?priority=Low|Medium|High to filter using the dedicated SQL query
// instead of fetching everything and filtering in JavaScript.
router.get(
  '/:boardId/tasks',
  asyncHandler((req, res) => {
    const board = loadBoardOr404(req.params.boardId);
    const { priority } = req.query;

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      throw new ApiError(400, `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const tasks = priority ? getTasksByPriority(board.id, priority) : getTasksForBoard(board.id);
    res.json(tasks);
  })
);

// GET /api/boards/:boardId/task-counts - number of tasks in each column.
router.get(
  '/:boardId/task-counts',
  asyncHandler((req, res) => {
    const board = loadBoardOr404(req.params.boardId);
    res.json(getTaskCountsPerColumn(board.id));
  })
);

export default router;
