export default function Toast({ message, action, onClose }) {
  return (
    <div className={`toast ${message ? "is-show" : ""}`} role="status">
      <span>{message}</span>
      {action && (
        <a className="toast__action" href={action.href} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          {action.label}
        </a>
      )}
      {action && <button className="toast__close" aria-label="Close" onClick={onClose}>×</button>}
    </div>
  );
}
