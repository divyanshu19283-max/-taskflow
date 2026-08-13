const BASE_URL = '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    // Network-level failure (server down, no connection, etc).
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (shouldn't normally happen once server responds).
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  getBoard: (boardId) => request(`/boards/${boardId}`),
  getTasks: (boardId, priority) =>
    request(`/boards/${boardId}/tasks${priority && priority !== 'All' ? `?priority=${priority}` : ''}`),
  createTask: (task) => request('/tasks', { method: 'POST', body: JSON.stringify(task) }),
  updateTask: (taskId, task) => request(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(task) }),
  moveTask: (taskId, column_id) =>
    request(`/tasks/${taskId}/move`, { method: 'PATCH', body: JSON.stringify({ column_id }) }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: 'DELETE' }),
};
