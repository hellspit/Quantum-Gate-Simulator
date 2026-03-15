"use client";

import React from "react";

const SINGLE_QUBIT_GATES = [
  { name: "H", label: "H", color: "#6366f1", description: "Hadamard" },
  { name: "X", label: "X", color: "#ef4444", description: "Pauli-X" },
  { name: "Y", label: "Y", color: "#f97316", description: "Pauli-Y" },
  { name: "Z", label: "Z", color: "#3b82f6", description: "Pauli-Z" },
  { name: "S", label: "S", color: "#8b5cf6", description: "S Phase" },
  { name: "T", label: "T", color: "#a855f7", description: "T Phase" },
];

const MULTI_QUBIT_GATES = [
  { name: "CNOT", label: "CX", color: "#10b981", description: "Controlled-NOT" },
  { name: "CZ", label: "CZ", color: "#14b8a6", description: "Controlled-Z" },
  { name: "SWAP", label: "SW", color: "#f59e0b", description: "SWAP" },
];

interface GateToolbarProps {
  onSelectGate: (gateName: string) => void;
  selectedGate: string | null;
}

export default function GateToolbar({ onSelectGate, selectedGate }: GateToolbarProps) {
  return (
    <div className="gate-toolbar">
      <div className="gate-group">
        <h3 className="gate-group-title">Single Qubit</h3>
        <div className="gate-buttons">
          {SINGLE_QUBIT_GATES.map((gate) => (
            <button
              key={gate.name}
              className={`gate-btn ${selectedGate === gate.name ? "gate-btn-active" : ""}`}
              style={{
                "--gate-color": gate.color,
                "--gate-color-dim": gate.color + "33",
              } as React.CSSProperties}
              onClick={() => onSelectGate(gate.name)}
              title={gate.description}
            >
              {gate.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gate-divider" />

      <div className="gate-group">
        <h3 className="gate-group-title">Multi Qubit</h3>
        <div className="gate-buttons">
          {MULTI_QUBIT_GATES.map((gate) => (
            <button
              key={gate.name}
              className={`gate-btn ${selectedGate === gate.name ? "gate-btn-active" : ""}`}
              style={{
                "--gate-color": gate.color,
                "--gate-color-dim": gate.color + "33",
              } as React.CSSProperties}
              onClick={() => onSelectGate(gate.name)}
              title={gate.description}
            >
              {gate.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Get the colour for a gate by name */
export function getGateColor(gateName: string): string {
  const all = [...SINGLE_QUBIT_GATES, ...MULTI_QUBIT_GATES];
  return all.find((g) => g.name === gateName)?.color ?? "#666";
}

/** Check if a gate is multi-qubit */
export function isMultiQubitGate(gateName: string): boolean {
  return MULTI_QUBIT_GATES.some((g) => g.name === gateName);
}
