import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import Filter from './components/Filter.jsx';
import Board from './components/Board.jsx';
import TaskModal from './components/TaskModal.jsx';
import Toast from './components/Toast.jsx';

// TaskFlow only ever has one board (per the assignment scope: no multi-board,
// no auth). The seed script always creates board id 1.
const BOARD_ID = 1;

export default function App() {
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = creating
  const [defaultColumnId, setDefaultColumnId] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const loadTasks = useCallback(async (currentFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks(BOARD_ID, currentFilter);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the board (columns) once.
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getBoard(BOARD_ID);
        setBoard(data);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);

  // Reload tasks whenever the filter changes.
  useEffect(() => {
    loadTasks(filter);
  }, [filter, loadTasks]);

  function openCreateModal(columnId) {
    setEditingTask(null);
    setDefaultColumnId(columnId ?? board?.columns?.[0]?.id ?? null);
    setModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setDefaultColumnId(task.column_id);
    setModalOpen(true);
  }

  async function handleSave(formData) {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
        showToast('Task updated');
      } else {
        await api.createTask(formData);
        showToast('Task created');
      }
      setModalOpen(false);
      await loadTasks(filter);
    } catch (err) {
      // Let the modal show the error inline instead of closing.
      throw err;
    }
  }

  async function handleDelete(task) {
    const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.deleteTask(task.id);
      showToast('Task deleted');
      await loadTasks(filter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMove(task, columnId) {
    if (columnId === task.column_id) return;
    // Optimistic update so the UI feels instant.
    const previousTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, column_id: columnId } : t)));

    try {
      await api.moveTask(task.id, columnId);
      showToast('Task moved');
    } catch (err) {
      setTasks(previousTasks); // roll back
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>TaskFlow</h1>
        <button className="btn btn-primary" onClick={() => openCreateModal(null)}>
          + New Task
        </button>
      </header>

      <Filter value={filter} onChange={setFilter} />

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
          <button className="banner-dismiss" onClick={() => setError(null)} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {loading && !board ? (
        <div className="loading-state">Loading board…</div>
      ) : board ? (
        <Board
          board={board}
          tasks={tasks}
          loading={loading}
          filter={filter}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onMove={handleMove}
          onAddTask={openCreateModal}
        />
      ) : null}

      {modalOpen && board && (
        <TaskModal
          columns={board.columns}
          task={editingTask}
          defaultColumnId={defaultColumnId}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
