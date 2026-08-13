import Column from './Column.jsx';

export default function Board({ board, tasks, loading, filter, onEdit, onDelete, onMove, onAddTask }) {
  const tasksByColumn = (columnId) => tasks.filter((t) => t.column_id === columnId);

  return (
    <div className="board">
      {board.columns.map((column) => (
        <Column
          key={column.id}
          column={column}
          allColumns={board.columns}
          tasks={tasksByColumn(column.id)}
          loading={loading}
          filter={filter}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  );
}
