"use client";
import { useEffect, useRef, useState } from "react";
import type { GateOperation } from "../types/circuit";
import type { PendingGate } from "./Workbench";
import { getNodeKind, getGateLabel, isMultiQubitGate } from "./GateToolbar";
import { gateFamily } from "../lib/gateData";
import Icon from "./Icon";
import QubitLabel from "./QubitLabel";
const CELL = 68;

interface Props {
  numQubits: number;
  qubitLabels?: string[];
  onLabelChange: (qubit: number, label: string) => void;
  initialStates: number[];
  operations: GateOperation[];
  selectedGate: string | null;
  pendingControl: PendingGate | null;
  onPlaceGate: (qubit: number, step: number, droppedGate?: string) => void;
  onRemoveGate: (id: string) => void;
  onToggleInitialState: (qubit: number) => void;
  onCancelSelection: () => void;
}
export default function CircuitBuilder({
  numQubits,
  qubitLabels,
  onLabelChange,
  initialStates,
  operations,
  selectedGate,
  pendingControl,
  onPlaceGate,
  onRemoveGate,
  onToggleInitialState,
  onCancelSelection,
}: Props) {
  const [dragCell, setDragCell] = useState<string | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(8);
  const gridViewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = gridViewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setVisibleSteps(
        Math.max(8, Math.floor((entry.contentRect.width - 132) / CELL)),
      ),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const numSteps = Math.max(
    visibleSteps,
    operations.reduce((max, op) => Math.max(max, op.step + 2), 0),
  );
  const grid: Record<string, GateOperation> = {};
  operations.forEach((op) => {
    grid[`${op.target}-${op.step}`] = op;
    if (op.control != null) grid[`${op.control}-${op.step}`] = op;
    if (op.control2 != null) grid[`${op.control2}-${op.step}`] = op;
  });
  const instruction = pendingControl
    ? `Choose the ${pendingControl.gate === "SWAP" ? "second" : pendingControl.gate === "CCNOT" && pendingControl.control2 == null ? "second control" : "target"} qubit in column ${pendingControl.step + 1}.`
    : selectedGate
      ? isMultiQubitGate(selectedGate)
        ? `Choose the ${selectedGate === "SWAP" ? "first" : "control"} qubit for ${getGateLabel(selectedGate)}.`
        : `Click an empty position to place ${selectedGate}.`
      : "Select a gate, then click a wire. Click a placed gate to remove it.";
  return (
    <div className="circuit-builder">
      <div
        className={`circuit-hint ${selectedGate ? "is-selecting" : ""}`}
        aria-live="polite"
      >
        <span className="hint-marker">
          {selectedGate ? (
            <span className="small-dot" />
          ) : (
            <Icon name="info" size={14} />
          )}
        </span>
        <span>{instruction}</span>
        {selectedGate && (
          <button className="hint-cancel" onClick={onCancelSelection}>
            Cancel <kbd>Esc</kbd>
          </button>
        )}
      </div>
      <div className="circuit-grid-wrapper" ref={gridViewport}>
        <div
          className="circuit-grid"
          style={{ minWidth: 112 + numSteps * CELL + 54 }}
        >
          <div className="circuit-row circuit-header-row">
            <div className="circuit-label">
              <span className="eyebrow">Register</span>
            </div>
            <div className="circuit-track">
              {Array.from({ length: numSteps }, (_, step) => (
                <div className="circuit-header-cell" key={step}>
                  {String(step + 1).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
          {Array.from({ length: numQubits }, (_, qubit) => (
            <div className="circuit-row" key={qubit}>
              <div className="circuit-label qubit-register">
                <span className="qubit-label">
                  q<span>{qubit}</span>
                </span>
                <button
                  className="ket-label"
                  onClick={() => onToggleInitialState(qubit)}
                  aria-label={`Qubit ${qubit} initial state ${initialStates[qubit]}. Click to toggle.`}
                >
                  |{initialStates[qubit]}⟩
                </button>
                <QubitLabel
                  qubit={qubit}
                  label={qubitLabels?.[qubit] ?? ""}
                  onChange={(label) => onLabelChange(qubit, label)}
                />
              </div>
              <div className="circuit-track">
                <div className="wire-line" />
                {Array.from({ length: numSteps }, (_, step) => {
                  const key = `${qubit}-${step}`,
                    op = grid[key];
                  const pending =
                    pendingControl?.step === step &&
                    (pendingControl.control === qubit ||
                      pendingControl.control2 === qubit);
                  const available =
                    !op &&
                    (!pendingControl ||
                      (step === pendingControl.step &&
                        qubit !== pendingControl.control &&
                        qubit !== pendingControl.control2));
                  const kind = op
                    ? getNodeKind(
                        op.gate,
                        op.target === qubit ? "target" : "control",
                      )
                    : null;
                  return (
                    <div
                      key={step}
                      className={`circuit-cell ${pendingControl?.step === step ? "in-pending-column" : ""} ${dragCell === key ? "drag-over" : ""}`}
                      onDragOver={(event) => {
                        if (
                          !op &&
                          event.dataTransfer.types.includes(
                            "application/quantum-gate",
                          )
                        ) {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "copy";
                          setDragCell(key);
                        }
                      }}
                      onDragLeave={() => setDragCell(null)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragCell(null);
                        if (!op)
                          onPlaceGate(
                            qubit,
                            step,
                            event.dataTransfer.getData(
                              "application/quantum-gate",
                            ),
                          );
                      }}
                    >
                      {op ? (
                        <>
                          <button
                            className={`placed-gate family-${gateFamily(op.gate)} node-${kind}`}
                            onClick={() => onRemoveGate(op.id)}
                            aria-label={`Remove ${op.gate} gate on qubit ${qubit}, step ${step + 1}`}
                            title={`Remove ${op.gate}`}
                          >
                            {kind === "box" ? (
                              op.gate
                            ) : kind === "swap" ? (
                              "×"
                            ) : kind === "target" ? (
                              "+"
                            ) : (
                              <span />
                            )}
                            <span className="gate-remove-badge">×</span>
                          </button>
                          {op.control != null &&
                            qubit ===
                              Math.min(
                                op.control,
                                op.control2 ?? op.control,
                                op.target,
                              ) && (
                              <div
                                className={`connector-line family-${gateFamily(op.gate)}`}
                                style={{
                                  height:
                                    (Math.max(
                                      op.control,
                                      op.control2 ?? op.control,
                                      op.target,
                                    ) -
                                      Math.min(
                                        op.control,
                                        op.control2 ?? op.control,
                                        op.target,
                                      )) *
                                    CELL,
                                }}
                              />
                            )}
                        </>
                      ) : pending ? (
                        <span
                          className="node-pending"
                          aria-label="Control selected"
                        />
                      ) : (
                        <button
                          className={`placement-slot ${selectedGate && available ? "slot-active" : ""}`}
                          disabled={!selectedGate || !available}
                          onClick={() => onPlaceGate(qubit, step)}
                          aria-label={`Place ${selectedGate ?? "gate"} on qubit ${qubit}, step ${step + 1}`}
                        >
                          <span>
                            {selectedGate ? getGateLabel(selectedGate) : "+"}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
                <span className="wire-end" aria-hidden="true">
                  ›
                </span>
              </div>
            </div>
          ))}
          {!operations.length && !selectedGate && (
            <div className="empty-circuit-note">
              An open canvas for your next experiment.
              <span>Choose a gate from the palette to begin.</span>
            </div>
          )}
        </div>
      </div>
      <div className="circuit-legend">
        <span>
          <i className="legend-superposition" />
          Superposition
        </span>
        <span>
          <i className="legend-pauli" />
          Pauli
        </span>
        <span>
          <i className="legend-phase" />
          Phase
        </span>
        <span>
          <i className="legend-controlled" />
          Controlled / swap
        </span>
        <span className="initial-hint">
          Click a label to rename · Click |0⟩ to change an input
        </span>
      </div>
    </div>
  );
}
