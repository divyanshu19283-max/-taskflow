import TaskCard from './TaskCard.jsx';

export default function Column({ column, allColumns, tasks, loading, filter, onEdit, onDelete, onMove, onAddTask }) {
  return (
    <section className="column">
      <div className="column-header">
        <h2>{column.name}</h2>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-body">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            {filter === 'All' ? 'No tasks yet.' : `No ${filter.toLowerCase()} priority tasks here.`}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              allColumns={allColumns}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))
        )}
      </div>

      <button className="btn btn-ghost column-add-btn" onClick={() => onAddTask(column.id)}>
        + Add task
      </button>
    </section>
  );
}
