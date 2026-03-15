/**
 * TypeScript interfaces for quantum circuit simulation.
 */

export interface Gate {
  name: string;
  num_qubits: number;
  description: string;
}

export interface GateOperation {
  gate: string;
  target: number;
  control?: number | null;
  id: string; // unique ID for React key
  step: number; // time step in circuit
}

export interface Circuit {
  num_qubits: number;
  operations: GateOperation[];
}

export interface StateVectorEntry {
  label: string;
  real: number;
  imag: number;
}

export interface SimulationResult {
  state_vector: StateVectorEntry[];
  probabilities: Record<string, number>;
  measurements: Record<string, number>;
  num_qubits: number;
}
