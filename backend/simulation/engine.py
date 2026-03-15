"""
Quantum Simulation Engine.

Tracks the full state vector and applies gate operations sequentially.
Supports up to 10 qubits (state vector size 1024).
"""

import numpy as np
from .gates import (
    SINGLE_QUBIT_GATES,
    MULTI_QUBIT_GATES,
    build_single_qubit_operator,
    build_two_qubit_operator,
)

MAX_QUBITS = 10


class QuantumSimulator:
    """Simulates a quantum circuit by evolving a state vector."""

    def __init__(self, num_qubits: int):
        if num_qubits < 1 or num_qubits > MAX_QUBITS:
            raise ValueError(
                f"num_qubits must be between 1 and {MAX_QUBITS}, got {num_qubits}"
            )
        self.num_qubits = num_qubits
        self.dim = 2 ** num_qubits
        self.state = np.zeros(self.dim, dtype=np.complex128)
        self.state[0] = 1.0  # |00...0⟩

    def reset(self):
        """Reset to the |00...0⟩ state."""
        self.state = np.zeros(self.dim, dtype=np.complex128)
        self.state[0] = 1.0

    def apply_gate(
        self,
        gate_name: str,
        target: int,
        control: int | None = None,
    ):
        """
        Apply a quantum gate to the state vector.

        For single-qubit gates: only `target` is used.
        For multi-qubit gates (CNOT, CZ): `control` is the control qubit,
            `target` is the target qubit.
        For SWAP: `control` and `target` are the two qubits to swap.
        """
        gate_name = gate_name.upper()

        if gate_name in SINGLE_QUBIT_GATES:
            if target < 0 or target >= self.num_qubits:
                raise ValueError(
                    f"Target qubit {target} out of range [0, {self.num_qubits - 1}]"
                )
            gate_matrix = SINGLE_QUBIT_GATES[gate_name]
            operator = build_single_qubit_operator(
                gate_matrix, target, self.num_qubits
            )

        elif gate_name in MULTI_QUBIT_GATES:
            if control is None:
                raise ValueError(
                    f"Gate {gate_name} requires a control qubit"
                )
            if target < 0 or target >= self.num_qubits:
                raise ValueError(
                    f"Target qubit {target} out of range [0, {self.num_qubits - 1}]"
                )
            if control < 0 or control >= self.num_qubits:
                raise ValueError(
                    f"Control qubit {control} out of range [0, {self.num_qubits - 1}]"
                )
            if control == target:
                raise ValueError("Control and target qubits must be different")

            gate_matrix = MULTI_QUBIT_GATES[gate_name]
            operator = build_two_qubit_operator(
                gate_matrix, control, target, self.num_qubits
            )

        else:
            raise ValueError(f"Unknown gate: {gate_name}")

        # Apply the operator to the state vector
        self.state = operator @ self.state

    def get_probabilities(self) -> dict[str, float]:
        """
        Calculate measurement probabilities for all basis states.

        Returns a dict mapping binary strings to probabilities.
        Only includes states with probability > 1e-10.
        """
        probs = np.abs(self.state) ** 2
        result = {}
        for i in range(self.dim):
            p = float(probs[i])
            if p > 1e-10:
                label = format(i, f"0{self.num_qubits}b")
                result[label] = round(p, 8)
        return result

    def measure(self, shots: int = 1024) -> dict[str, int]:
        """
        Simulate measurement by sampling from the probability distribution.

        Returns a dict mapping binary strings to counts.
        """
        probs = np.abs(self.state) ** 2
        indices = np.random.choice(self.dim, size=shots, p=probs)
        counts: dict[str, int] = {}
        for idx in indices:
            label = format(idx, f"0{self.num_qubits}b")
            counts[label] = counts.get(label, 0) + 1
        return dict(sorted(counts.items()))

    def get_state_vector(self) -> list[dict[str, float]]:
        """
        Return the state vector as a list of {real, imag, label} dicts.

        Only includes amplitudes with magnitude > 1e-10.
        """
        result = []
        for i in range(self.dim):
            amp = self.state[i]
            if abs(amp) > 1e-10:
                result.append({
                    "label": format(i, f"0{self.num_qubits}b"),
                    "real": round(float(amp.real), 8),
                    "imag": round(float(amp.imag), 8),
                })
        return result
