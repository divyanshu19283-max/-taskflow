const OPTIONS = ['All', 'Low', 'Medium', 'High'];

export default function Filter({ value, onChange }) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter tasks by priority">
      <span className="filter-label">Filter:</span>
      {OPTIONS.map((option) => (
        <button
          key={option}
          className={`filter-pill ${value === option ? 'active' : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
