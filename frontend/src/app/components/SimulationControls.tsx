"use client";
import Icon from "./Icon";
interface Props {
  onRun: () => void;
  isRunning: boolean;
  error: string | null;
  shots: number;
  onShotsChange: (shots: number) => void;
  pending: boolean;
}
export default function SimulationControls({
  onRun,
  isRunning,
  error,
  shots,
  onShotsChange,
  pending,
}: Props) {
  return (
    <div className="simulation-controls">
      <div className="run-controls">
        <div className="shots-control">
          <label htmlFor="shots">Measurement shots</label>
          <select
            id="shots"
            value={shots}
            onChange={(e) => onShotsChange(Number(e.target.value))}
          >
            {[128, 512, 1024, 4096, 10000].map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString("en-US")}
              </option>
            ))}
          </select>
        </div>
        <span className="run-note">
          {pending
            ? "Finish placing your gate to run"
            : "Exact state. Sampled measurements."}
        </span>
        <button
          className="run-btn"
          onClick={onRun}
          disabled={isRunning || pending}
        >
          {isRunning ? (
            <span className="spinner" />
          ) : (
            <Icon name="play" size={16} />
          )}
          {isRunning ? "Simulating…" : "Run circuit"}
          <kbd>⌘ / Ctrl ↵</kbd>
        </button>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          <Icon name="info" size={16} />
          <span>{error}</span>
          <button onClick={onRun} disabled={isRunning || pending}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
