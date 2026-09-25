import type { GateOperation } from "../types/circuit";
export default function CircuitPreview({
  operations,
  qubits = 2,
}: {
  operations: Omit<GateOperation, "id">[];
  qubits?: number;
}) {
  const rows = qubits;
  const maxStep = Math.max(2, ...operations.map((op) => op.step));
  return (
    <svg
      className="circuit-preview"
      viewBox={`0 0 260 ${rows * 26 + 12}`}
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: rows }, (_, i) => (
        <g key={i}>
          <text
            x="0"
            y={22 + i * 26}
            fill="currentColor"
            fontSize="9"
            fontFamily="monospace"
          >
            q{i}
          </text>
          <path
            d={`M25 ${18 + i * 26}H258`}
            stroke="currentColor"
            opacity="0.22"
          />
        </g>
      ))}
      {operations.map((op, i) => {
        const x = 51 + (op.step / maxStep) * 169,
          y = 18 + op.target * 26,
          cy = 18 + (op.control ?? 0) * 26,
          c2y = 18 + (op.control2 ?? op.control ?? 0) * 26;
        return (
          <g key={i}>
            {op.control != null && (
              <>
                <path
                  d={`M${x} ${Math.min(cy, c2y, y)}V${Math.max(cy, c2y, y)}`}
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                />
                <circle cx={x} cy={cy} r="3" fill="var(--accent)" />
                {op.control2 != null && (
                  <circle cx={x} cy={c2y} r="3" fill="var(--accent)" />
                )}
              </>
            )}
            {op.gate === "CNOT" || op.gate === "CCNOT" ? (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill="var(--surface)"
                  stroke="var(--accent)"
                />
                <path d={`M${x - 4} ${y}h8m-4-4v8`} stroke="var(--accent)" />
              </>
            ) : (
              <>
                <rect
                  x={x - 9}
                  y={y - 9}
                  width="18"
                  height="18"
                  rx="3"
                  fill="var(--surface)"
                  stroke="var(--accent)"
                  strokeOpacity="0.65"
                />
                <text
                  x={x}
                  y={y + 3.5}
                  fill="var(--accent)"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {op.gate === "SWAP" ? "×" : op.gate}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
