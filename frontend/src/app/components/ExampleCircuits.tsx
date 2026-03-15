"use client";

import React from "react";
import type { GateOperation } from "../types/circuit";

interface ExampleCircuit {
  name: string;
  description: string;
  numQubits: number;
  operations: Omit<GateOperation, "id">[];
}

const EXAMPLES: ExampleCircuit[] = [
  {
    name: "Superposition",
    description: "Single qubit in equal superposition using Hadamard",
    numQubits: 1,
    operations: [{ gate: "H", target: 0, control: null, step: 0 }],
  },
  {
    name: "Bell State",
    description: "Entangled pair: |00⟩ + |11⟩",
    numQubits: 2,
    operations: [
      { gate: "H", target: 0, control: null, step: 0 },
      { gate: "CNOT", target: 1, control: 0, step: 1 },
    ],
  },
  {
    name: "GHZ State",
    description: "3-qubit entanglement: |000⟩ + |111⟩",
    numQubits: 3,
    operations: [
      { gate: "H", target: 0, control: null, step: 0 },
      { gate: "CNOT", target: 1, control: 0, step: 1 },
      { gate: "CNOT", target: 2, control: 0, step: 2 },
    ],
  },
  {
    name: "Bit Flip",
    description: "Apply X gate to flip |0⟩ → |1⟩",
    numQubits: 1,
    operations: [{ gate: "X", target: 0, control: null, step: 0 }],
  },
  {
    name: "SWAP Qubits",
    description: "Swap states of two qubits",
    numQubits: 2,
    operations: [
      { gate: "X", target: 0, control: null, step: 0 },
      { gate: "SWAP", target: 1, control: 0, step: 1 },
    ],
  },
];

interface ExampleCircuitsProps {
  onLoadExample: (numQubits: number, ops: Omit<GateOperation, "id">[]) => void;
}

export default function ExampleCircuits({ onLoadExample }: ExampleCircuitsProps) {
  return (
    <div className="example-circuits">
      <h3 className="examples-title">Example Circuits</h3>
      <div className="examples-grid">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.name}
            className="example-btn"
            onClick={() => onLoadExample(ex.numQubits, ex.operations)}
            title={ex.description}
          >
            <span className="example-name">{ex.name}</span>
            <span className="example-desc">{ex.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
