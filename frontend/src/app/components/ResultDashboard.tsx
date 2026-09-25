"use client";
import { useState } from "react";
import type { SimulationResult } from "../types/circuit";
import BlochSphere from "./BlochSphere";
import BlochExplorer from "./BlochExplorer";
import Icon from "./Icon";
type Tab = "probability" | "measurement" | "amplitudes";
function EmptyPlot() {
  return (
    <div className="empty-plot">
      <svg viewBox="0 0 260 92" aria-hidden="true">
        <path
          d="M12 76H248M12 12v64"
          fill="none"
          stroke="currentColor"
          strokeOpacity=".35"
        />
        {[36, 88, 140, 192].map((x) => (
          <rect
            key={x}
            x={x}
            y="31"
            width="28"
            height="45"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeDasharray="3 4"
            strokeOpacity=".6"
          />
        ))}
      </svg>
      <strong>The possibilities are waiting.</strong>
      <p>Run your circuit to reveal its quantum state.</p>
      <span className="empty-plot-note">
        Exact probabilities · Sampled outcomes · Complex amplitudes
      </span>
    </div>
  );
}
export default function ResultDashboard({
  result,
  stale = false,
  isRunning = false,
  qubitLabels = [],
}: {
  result: SimulationResult | null;
  stale?: boolean;
  isRunning?: boolean;
  qubitLabels?: string[];
}) {
  const [tab, setTab] = useState<Tab>("probability");
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const qubit = result ? Math.min(selectedQubit, result.num_qubits - 1) : 0;
  const vector = result?.bloch_vectors[String(qubit)] ?? [0, 0, 1];
  const length = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );
  const totalShots = Object.values(result?.measurements ?? {}).reduce(
    (sum, n) => sum + n,
    0,
  );
  const labels = result ? Object.keys(result.probabilities).sort() : [];
  const tabs: { id: Tab; label: string }[] = [
    { id: "probability", label: "Probabilities" },
    { id: "measurement", label: "Measurements" },
    { id: "amplitudes", label: "State vector" },
  ];
  return (
    <div
      className={`results-grid ${stale ? "has-stale-results" : ""}`}
      aria-busy={isRunning}
    >
      <section className="distribution-panel">
        <div
          className="results-tabs"
          role="tablist"
          aria-label="Simulation results"
        >
          {tabs.map((item, index) => (
            <button
              role="tab"
              key={item.id}
              id={`tab-${item.id}`}
              aria-controls="result-panel"
              aria-selected={tab === item.id}
              tabIndex={tab === item.id ? 0 : -1}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === "ArrowRight")
                  next = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft")
                  next = (index + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else return;
                event.preventDefault();
                setTab(tabs[next].id);
                document.getElementById(`tab-${tabs[next].id}`)?.focus();
              }}
            >
              {item.label}
            </button>
          ))}
          <span className="result-count">
            {result ? `${labels.length} states` : "—"}
          </span>
        </div>
        <div
          role="tabpanel"
          id="result-panel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className="result-panel-body"
        >
          {!result ? (
            <EmptyPlot />
          ) : (
            <>
              <div className="chart-heading">
                <div>
                  <h3>
                    {tab === "probability"
                      ? "Every possible outcome."
                      : tab === "measurement"
                        ? "From probability to observation."
                        : "Inside the quantum state."}
                  </h3>
                  <p>
                    {tab === "probability"
                      ? "The exact chance of measuring each basis state."
                      : tab === "measurement"
                        ? `${totalShots.toLocaleString("en-US")} samples from the final state. Counts vary between runs.`
                        : "Complex amplitudes and their relative phases."}
                  </p>
                </div>
                <span className={`chart-badge ${stale ? "stale-badge" : ""}`}>
                  {stale
                    ? "Previous run"
                    : tab === "measurement"
                      ? "SAMPLED"
                      : "EXACT"}
                </span>
              </div>
              {tab === "amplitudes" ? (
                <div className="state-vector-scroll">
                  <table className="state-vector-table">
                    <thead>
                      <tr>
                        <th>Basis state</th>
                        <th>Amplitude</th>
                        <th>Probability</th>
                        <th>Phase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.state_vector.map((entry) => {
                        const probability = entry.real ** 2 + entry.imag ** 2;
                        const amplitude =
                          entry.imag === 0
                            ? entry.real.toFixed(4)
                            : entry.real === 0
                              ? `${entry.imag.toFixed(4)}i`
                              : `${entry.real.toFixed(4)} ${entry.imag < 0 ? "−" : "+"} ${Math.abs(entry.imag).toFixed(4)}i`;
                        return (
                          <tr key={entry.label}>
                            <td className="basis-ket">|{entry.label}⟩</td>
                            <td>{amplitude}</td>
                            <td>{(probability * 100).toFixed(2)}%</td>
                            <td>
                              {(
                                (Math.atan2(entry.imag, entry.real) * 180) /
                                Math.PI
                              ).toFixed(1)}
                              °
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="histogram-area">
                  <div className="hist-axis">
                    <span>Basis state</span>
                    <div>
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                    <span>
                      {tab === "probability" ? "Probability" : "Counts"}
                    </span>
                  </div>
                  <div className="histogram">
                    {labels.map((label) => {
                      const count = result.measurements[label] ?? 0;
                      const probability = result.probabilities[label];
                      const amount =
                        tab === "probability"
                          ? probability
                          : count / totalShots;
                      return (
                        <div className="hist-row" key={label}>
                          <span className="hist-label">|{label}⟩</span>
                          <div className="hist-bar-track">
                            <div
                              className={`hist-bar ${tab === "measurement" ? "hist-bar-measurement" : ""}`}
                              style={{
                                width: `${amount * 100}%`,
                                minWidth: amount > 0 ? 2 : 0,
                              }}
                            />
                            {tab === "measurement" && (
                              <span
                                className="theory-marker"
                                style={{ left: `${probability * 100}%` }}
                                title={`Exact probability: ${(probability * 100).toFixed(2)}%`}
                              />
                            )}
                          </div>
                          <span className="hist-value">
                            {tab === "probability"
                              ? `${(probability * 100).toFixed(2)}%`
                              : count.toLocaleString("en-US")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="panel-footer">
          <span className="small-dot" />
          {!result
            ? "Ready when you are"
            : tab === "measurement"
              ? "White markers show exact probabilities"
              : tab === "amplitudes"
                ? "Probability = |amplitude|²"
                : "Probabilities sum to 100%"}
          <span>
            {result
              ? `${result.num_qubits} QUBIT${result.num_qubits === 1 ? "" : "S"}`
              : "AWAITING FIRST RUN"}
          </span>
        </div>
      </section>
      <section className="qubit-panel">
        <div className="qubit-panel-head">
          <h3>Qubit state</h3>
          {result ? (
            <div className="qubit-panel-actions">
              <button
                className="view-all-qubits"
                onClick={() => setExplorerOpen(true)}
                aria-haspopup="dialog"
              >
                <Icon name="expand" size={13} />
                View all qubits
              </button>
              <select
                aria-label="Select qubit to visualize"
                value={qubit}
                onChange={(event) =>
                  setSelectedQubit(Number(event.target.value))
                }
              >
                {Array.from({ length: result.num_qubits }, (_, i) => (
                  <option value={i} key={i}>
                    q{i}
                    {qubitLabels[i] ? ` · ${qubitLabels[i]}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="mono">BLOCH SPHERE</span>
          )}
        </div>
        {result ? (
          <>
            {qubitLabels[qubit] && (
              <p className="bloch-qubit-name">{qubitLabels[qubit]}</p>
            )}
            <BlochSphere
              rx={vector[0]}
              ry={vector[1]}
              rz={vector[2]}
              qubitLabel={String(qubit)}
            />
            <div className="bloch-coordinates">
              {["X", "Y", "Z"].map((axis, i) => (
                <span key={axis}>
                  <span>{axis}</span>
                  {vector[i].toFixed(3)}
                </span>
              ))}
            </div>
            <div className="bloch-state-caption">
              <span
                className={`state-pill ${length < 0.999 ? "mixed-state" : ""}`}
              >
                {length < 0.999 ? "Mixed state" : "Pure state"}
              </span>
              <span>
                {length < 0.999
                  ? "Entangled with the register"
                  : "On the sphere surface"}
              </span>
            </div>
          </>
        ) : (
          <div className="bloch-empty">
            <svg viewBox="0 0 260 220" fill="none" aria-hidden="true">
              <g stroke="currentColor">
                <circle cx="130" cy="109" r="73" />
                <ellipse cx="130" cy="109" rx="73" ry="25" />
                <ellipse cx="130" cy="109" rx="28" ry="73" />
                <path
                  d="M130 24v171M42 109h177M72 166 188 52"
                  strokeDasharray="3 4"
                  opacity=".65"
                />
              </g>
              <g fill="currentColor" fontSize="12" fontFamily="monospace">
                <text x="120" y="16">
                  |0⟩
                </text>
                <text x="120" y="212">
                  |1⟩
                </text>
              </g>
              <circle cx="130" cy="109" r="4" fill="var(--text-muted)" />
            </svg>
            <p>A new perspective on your qubits.</p>
          </div>
        )}
        <div className="panel-footer">
          <Icon name="info" size={13} />
          <span>
            {result
              ? "Drag to orbit · Select a qubit to inspect"
              : "Run the circuit to visualize its state"}
          </span>
        </div>
      </section>
      {explorerOpen && result && (
        <BlochExplorer
          result={result}
          qubitLabels={qubitLabels}
          stale={stale}
          isRunning={isRunning}
          onClose={() => setExplorerOpen(false)}
        />
      )}
    </div>
  );
}
