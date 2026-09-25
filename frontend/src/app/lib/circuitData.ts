import type { GateOperation } from "../types/circuit";
import algorithmCircuits from "./algorithmCircuits.json";
import arithmeticCircuits from "./arithmeticCircuits.json";

export interface PrebuiltCircuit {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  qubits: number;
  initialStates: number[];
  operations: Omit<GateOperation, "id">[];
  status: "ready" | "coming-soon";
  qubitLabels?: string[];
  registerGuide?: { inputs: string; outputs: string };
}

let stepCounter = 0;
function op(gate: string, target: number, control: number | null = null, step?: number): Omit<GateOperation, "id"> {
  return { gate, target, control, step: step ?? stepCounter++ };
}

function resetStep() { stepCounter = 0; }

// ──────────────────────────────────────────────────────

resetStep();
const bellState: PrebuiltCircuit = {
  id: "bell-state",
  name: "Bell State",
  category: "Entanglement & Teleportation",
  description: "Creates maximally entangled EPR pair between two qubits using H + CNOT.",
  longDescription:
    "The Bell State is the simplest example of quantum entanglement. It starts with two qubits in the |00⟩ state, applies a Hadamard gate to the first qubit to create a superposition, then applies a CNOT gate using the first qubit as control and the second as target. The result is the famous Bell state (|00⟩ + |11⟩)/√2 — measuring one qubit instantly determines the other, regardless of distance. This circuit is the building block for quantum teleportation, superdense coding, and many quantum communication protocols.",
  qubits: 2,
  initialStates: [0, 0],
  operations: [op("H", 0, null, 0), op("CNOT", 1, 0, 1)],
  status: "ready",
};

resetStep();
const ghzState: PrebuiltCircuit = {
  id: "ghz-state",
  name: "GHZ State",
  category: "Entanglement & Teleportation",
  description: "Extends entanglement to 3+ qubits — a key resource for quantum error correction.",
  longDescription:
    "The GHZ (Greenberger–Horne–Zeilinger) state generalizes the Bell state to three or more qubits, producing the state (|000⟩ + |111⟩)/√2. It begins with a Hadamard on qubit 0, followed by cascading CNOT gates. The GHZ state is fundamentally different from pairwise entanglement — it exhibits genuine multipartite entanglement. This makes it essential for quantum error correction, secret sharing protocols, and tests of quantum non-locality (ruling out local hidden variable theories). Measuring any single qubit collapses all three simultaneously.",
  qubits: 3,
  initialStates: [0, 0, 0],
  operations: [op("H", 0, null, 0), op("CNOT", 1, 0, 1), op("CNOT", 2, 0, 2)],
  status: "ready",
};

resetStep();
const superposition: PrebuiltCircuit = {
  id: "superposition",
  name: "Superposition",
  category: "Fundamentals",
  description: "Creates equal superposition across all basis states using Hadamard gates.",
  longDescription:
    "Superposition is one of the most fundamental concepts in quantum computing. By applying a Hadamard gate to each qubit initialized in |0⟩, we create an equal superposition of all possible basis states. For n qubits, this produces 2ⁿ states each with equal probability 1/2ⁿ. This circuit demonstrates massive quantum parallelism — with just 2 qubits, we represent 4 states simultaneously. Superposition is the starting point for virtually every quantum algorithm, including Grover's search and the Quantum Fourier Transform.",
  qubits: 2,
  initialStates: [0, 0],
  operations: [op("H", 0, null, 0), op("H", 1, null, 0)],
  status: "ready",
};

resetStep();
const quantumTeleportation: PrebuiltCircuit = {
  id: "quantum-teleportation",
  name: "Quantum Teleportation",
  category: "Entanglement & Teleportation",
  description: "Transfers an arbitrary qubit state using entanglement and classical communication.",
  longDescription:
    "Quantum teleportation transfers the quantum state of one qubit to another distant qubit, using a shared Bell pair and two classical bits of communication. The protocol first entangles qubits 1 and 2 into a Bell state. Then qubit 0 (the state to teleport) is entangled with qubit 1 via CNOT and measured. Based on the measurement results, corrections (X and/or Z gates) are applied to qubit 2, which then holds the original state of qubit 0. Note: no physical matter moves — only the quantum information is transferred. This is a cornerstone of quantum networking.",
  qubits: 3,
  initialStates: [1, 0, 0],
  operations: [
    op("H", 1, null, 0), op("CNOT", 2, 1, 1),
    op("CNOT", 1, 0, 2), op("H", 0, null, 3),
  ],
  status: "ready",
};

// ──── Runnable arithmetic examples ──────────────

const halfAdder: PrebuiltCircuit = {
  ...arithmeticCircuits["half-adder"],
  status: "ready",
};

const fullAdder: PrebuiltCircuit = {
  ...arithmeticCircuits["full-adder"],
  status: "ready",
};

const quantumMultiplier: PrebuiltCircuit = {
  ...arithmeticCircuits["quantum-multiplier"],
  status: "ready",
};

// Runnable algorithm examples

const deutschJozsa: PrebuiltCircuit = {
  ...algorithmCircuits["deutsch-jozsa"],
  status: "ready",
};

const bernsteinVazirani: PrebuiltCircuit = {
  ...algorithmCircuits["bernstein-vazirani"],
  status: "ready",
};

const groversSearch: PrebuiltCircuit = {
  ...algorithmCircuits["grovers-search"],
  status: "ready",
};

// ──── Error correction (coming soon) ────────────────

const bitFlipCode: PrebuiltCircuit = {
  id: "bit-flip-code",
  name: "Bit-Flip Code",
  category: "Error Correction",
  description: "Encodes 1 logical qubit into 3 physical qubits to protect against bit-flip errors.",
  longDescription:
    "The 3-qubit bit-flip code is the simplest quantum error correction code. It encodes a single logical qubit |ψ⟩ = α|0⟩ + β|1⟩ into three physical qubits as α|000⟩ + β|111⟩ using two CNOT gates. If a bit-flip error (X gate) occurs on any single qubit, a majority vote using syndrome measurements can detect and correct it. While it only protects against X errors (not phase errors), it demonstrates the fundamental principle of redundancy-based quantum error correction.",
  qubits: 3,
  initialStates: [0, 0, 0],
  operations: [],
  status: "coming-soon",
};

const phaseFlipCode: PrebuiltCircuit = {
  id: "phase-flip-code",
  name: "Phase-Flip Code",
  category: "Error Correction",
  description: "Protects against single phase-flip errors using 3-qubit redundancy.",
  longDescription:
    "The phase-flip code protects against Z (phase-flip) errors by encoding in the Hadamard basis. It transforms the bit-flip code by wrapping it in Hadamard gates: encode with CNOT, apply H to all qubits, then reverse after error correction. A phase flip in the computational basis becomes a bit flip in the Hadamard basis, which can be corrected using the standard majority vote. Combined with the bit-flip code, this leads to the 9-qubit Shor code — the first complete quantum error correction code.",
  qubits: 3,
  initialStates: [0, 0, 0],
  operations: [],
  status: "coming-soon",
};

// ──── Export ─────────────────────────────────────────

export const ALL_CIRCUITS: PrebuiltCircuit[] = [
  superposition,
  bellState,
  ghzState,
  quantumTeleportation,
  halfAdder,
  fullAdder,
  quantumMultiplier,
  deutschJozsa,
  bernsteinVazirani,
  groversSearch,
  bitFlipCode,
  phaseFlipCode,
];

export function getCircuitById(id: string): PrebuiltCircuit | undefined {
  return ALL_CIRCUITS.find((c) => c.id === id);
}

export function getCircuitsByCategory(): { title: string; circuits: PrebuiltCircuit[] }[] {
  const map = new Map<string, PrebuiltCircuit[]>();
  for (const c of ALL_CIRCUITS) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push(c);
  }
  return Array.from(map.entries()).map(([title, circuits]) => ({ title, circuits }));
}
