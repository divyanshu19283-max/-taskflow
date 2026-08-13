const PRIORITY_CLASS = {
  Low: 'priority-low',
  Medium: 'priority-medium',
  High: 'priority-high',
};

function formatDate(isoString) {
  // SQLite's datetime('now') returns "YYYY-MM-DD HH:MM:SS" (UTC, no timezone marker).
  // Appending "Z" lets Date parse it correctly as UTC before formatting locally.
  const date = new Date(isoString.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TaskCard({ task, allColumns, onEdit, onDelete, onMove }) {
  return (
    <article className="task-card">
      <div className="task-card-top">
        <h3>{task.title}</h3>
        <span className={`priority-badge ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className="task-date">{formatDate(task.created_at)}</span>
      </div>

      <div className="task-actions">
        <label className="move-control">
          <span className="sr-only">Move task</span>
          <select
            value={task.column_id}
            onChange={(e) => onMove(task, Number(e.target.value))}
            aria-label={`Move "${task.title}" to another column`}
          >
            {allColumns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.id === task.column_id ? `📍 ${col.name}` : `Move to ${col.name}`}
              </option>
            ))}
          </select>
        </label>

        <div className="task-actions-buttons">
          <button className="btn btn-text" onClick={() => onEdit(task)}>
            Edit
          </button>
          <button className="btn btn-text btn-danger" onClick={() => onDelete(task)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
