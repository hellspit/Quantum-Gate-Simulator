"use client";
import type { GateOperation } from "../types/circuit";
import Icon from "./Icon";
const examples = [
  {
    name: "Bell State",
    label: "Bell pair",
    qubits: 2,
    description: "Entangle two qubits",
    operations: [
      { gate: "H", target: 0, control: null, step: 0 },
      { gate: "CNOT", target: 1, control: 0, step: 1 },
    ],
  },
  {
    name: "Superposition",
    label: "Superposition",
    qubits: 1,
    description: "Explore equal probabilities",
    operations: [{ gate: "H", target: 0, control: null, step: 0 }],
  },
  {
    name: "GHZ State",
    label: "GHZ state",
    qubits: 3,
    description: "Entangle three qubits",
    operations: [
      { gate: "H", target: 0, control: null, step: 0 },
      { gate: "CNOT", target: 1, control: 0, step: 1 },
      { gate: "CNOT", target: 2, control: 0, step: 2 },
    ],
  },
  {
    name: "SWAP Qubits",
    label: "State swap",
    qubits: 2,
    description: "Exchange two qubit states",
    operations: [
      { gate: "X", target: 0, control: null, step: 0 },
      { gate: "SWAP", target: 1, control: 0, step: 1 },
    ],
  },
];
export default function ExampleCircuits({
  onLoadExample,
  activeName,
}: {
  onLoadExample: (
    qubits: number,
    ops: Omit<GateOperation, "id">[],
    name: string,
  ) => void;
  activeName: string;
}) {
  return (
    <div className="example-circuits">
      <span className="eyebrow">Start with an idea</span>
      <div className="example-options">
        {examples.map((ex) => (
          <button
            key={ex.name}
            className={`example-btn ${activeName === ex.name ? "example-active" : ""}`}
            onClick={() => onLoadExample(ex.qubits, ex.operations, ex.name)}
            title={ex.description}
          >
            <span className="example-qubits">{ex.qubits}q</span>
            {ex.label}
            <Icon name={activeName === ex.name ? "check" : "arrow"} size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}
