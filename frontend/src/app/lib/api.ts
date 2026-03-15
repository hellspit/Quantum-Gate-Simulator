/**
 * API client for the quantum simulation backend.
 */

import type { SimulationResult, Gate, GateOperation } from "../types/circuit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function simulateCircuit(
  num_qubits: number,
  operations: GateOperation[],
  shots: number = 1024
): Promise<SimulationResult> {
  const body = {
    num_qubits,
    operations: operations.map((op) => ({
      gate: op.gate,
      target: op.target,
      control: op.control ?? null,
    })),
    shots,
  };

  const res = await fetch(`${API_BASE}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchGates(): Promise<Gate[]> {
  const res = await fetch(`${API_BASE}/api/gates`);
  if (!res.ok) {
    throw new Error(`Failed to fetch gates: HTTP ${res.status}`);
  }
  return res.json();
}
