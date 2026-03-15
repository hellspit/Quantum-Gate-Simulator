"use client";

import React from "react";
import type { GateOperation } from "../types/circuit";
import { getGateColor, isMultiQubitGate } from "./GateToolbar";

interface CircuitBuilderProps {
  numQubits: number;
  operations: GateOperation[];
  selectedGate: string | null;
  onAddQubit: () => void;
  onRemoveQubit: () => void;
  onPlaceGate: (target: number, step: number) => void;
  onRemoveGate: (id: string) => void;
  onReset: () => void;
  pendingControl: { gate: string; control: number; step: number } | null;
}

export default function CircuitBuilder({
  numQubits,
  operations,
  selectedGate,
  onAddQubit,
  onRemoveQubit,
  onPlaceGate,
  onRemoveGate,
  onReset,
  pendingControl,
}: CircuitBuilderProps) {
  // Calculate number of time steps to show
  const maxStep = operations.reduce((max, op) => Math.max(max, op.step), -1);
  const numSteps = Math.max(maxStep + 2, 8); // at least 8 columns

  // Build a grid lookup: grid[qubit][step] = operation
  const grid: Record<string, GateOperation> = {};
  for (const op of operations) {
    grid[`${op.target}-${op.step}`] = op;
    if (op.control !== null && op.control !== undefined) {
      grid[`${op.control}-${op.step}`] = op;
    }
  }

  return (
    <div className="circuit-builder">
      {/* Circuit header controls */}
      <div className="circuit-controls">
        <div className="qubit-controls">
          <button onClick={onRemoveQubit} disabled={numQubits <= 1} className="circuit-ctrl-btn" title="Remove qubit">
            −
          </button>
          <span className="qubit-count">{numQubits} Qubit{numQubits > 1 ? "s" : ""}</span>
          <button onClick={onAddQubit} disabled={numQubits >= 10} className="circuit-ctrl-btn" title="Add qubit">
            +
          </button>
        </div>
        <button onClick={onReset} className="circuit-reset-btn" title="Reset circuit">
          Reset
        </button>
      </div>

      {/* Instruction hint */}
      {selectedGate && (
        <div className="circuit-hint">
          {pendingControl ? (
            <span>
              Click a cell to set <strong>target</strong> for {pendingControl.gate}
            </span>
          ) : isMultiQubitGate(selectedGate) ? (
            <span>
              Click a cell to set <strong>control</strong> qubit for {selectedGate}
            </span>
          ) : (
            <span>
              Click a cell to place <strong>{selectedGate}</strong> gate
            </span>
          )}
        </div>
      )}

      {/* Circuit grid */}
      <div className="circuit-grid-wrapper">
        <div className="circuit-grid">
          {/* Column headers (time steps) */}
          <div className="circuit-row circuit-header-row">
            <div className="circuit-label" />
            {Array.from({ length: numSteps }, (_, step) => (
              <div key={step} className="circuit-header-cell">
                {step}
              </div>
            ))}
          </div>

          {/* Qubit rows */}
          {Array.from({ length: numQubits }, (_, qubit) => (
            <div key={qubit} className="circuit-row">
              <div className="circuit-label">
                <span className="qubit-label">q{qubit}</span>
                <span className="ket-label">|0⟩</span>
              </div>

              {Array.from({ length: numSteps }, (_, step) => {
                const key = `${qubit}-${step}`;
                const op = grid[key];
                const isTarget = op && op.target === qubit;
                const isControl = op && op.control === qubit;
                const isPendingControlCell =
                  pendingControl && pendingControl.control === qubit && pendingControl.step === step;

                return (
                  <div
                    key={step}
                    className={`circuit-cell ${selectedGate ? "circuit-cell-clickable" : ""} ${isPendingControlCell ? "circuit-cell-pending" : ""}`}
                    onClick={() => selectedGate && onPlaceGate(qubit, step)}
                  >
                    {/* Qubit wire line */}
                    <div className="wire-line" />

                    {/* Gate or control dot */}
                    {isTarget && (
                      <div
                        className="gate-chip"
                        style={{ backgroundColor: getGateColor(op.gate) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveGate(op.id);
                        }}
                        title={`${op.gate} — click to remove`}
                      >
                        {op.gate === "CNOT" ? "X" : op.gate === "SWAP" ? "×" : op.gate}
                      </div>
                    )}
                    {isControl && !isTarget && (
                      <div
                        className="control-dot"
                        style={{ backgroundColor: getGateColor(op.gate) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveGate(op.id);
                        }}
                        title={`${op.gate} control — click to remove`}
                      />
                    )}

                    {/* Vertical connector between control and target */}
                    {op && op.control !== null && op.control !== undefined && (
                      (() => {
                        const minQ = Math.min(op.control, op.target);
                        const maxQ = Math.max(op.control, op.target);
                        if (qubit === minQ) {
                          return (
                            <div
                              className="connector-line"
                              style={{
                                backgroundColor: getGateColor(op.gate),
                                height: `${(maxQ - minQ) * 56}px`,
                                top: "50%",
                              }}
                            />
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
