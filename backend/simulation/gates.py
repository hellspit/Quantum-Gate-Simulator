"""
Quantum gate matrix definitions and helper utilities.

All gates are represented as NumPy complex128 matrices.
Single-qubit gates are 2×2; multi-qubit gates are 4×4.
"""

import numpy as np
from functools import reduce

# ─── Single-Qubit Gates ────────────────────────────────────────────────

# Pauli-X (NOT gate)
X = np.array([[0, 1],
              [1, 0]], dtype=np.complex128)

# Pauli-Y
Y = np.array([[0, -1j],
              [1j, 0]], dtype=np.complex128)

# Pauli-Z
Z = np.array([[1, 0],
              [0, -1]], dtype=np.complex128)

# Hadamard
H = np.array([[1, 1],
              [1, -1]], dtype=np.complex128) / np.sqrt(2)

# S Gate (Phase gate, π/2)
S = np.array([[1, 0],
              [0, 1j]], dtype=np.complex128)

# T Gate (π/8 gate)
T = np.array([[1, 0],
              [0, np.exp(1j * np.pi / 4)]], dtype=np.complex128)

# Identity (used for tensor products)
I = np.eye(2, dtype=np.complex128)


# ─── Multi-Qubit Gates ─────────────────────────────────────────────────

# CNOT (Controlled-NOT) — control qubit 0, target qubit 1
CNOT = np.array([[1, 0, 0, 0],
                 [0, 1, 0, 0],
                 [0, 0, 0, 1],
                 [0, 0, 1, 0]], dtype=np.complex128)

# CZ (Controlled-Z) — control qubit 0, target qubit 1
CZ = np.array([[1, 0, 0, 0],
               [0, 1, 0, 0],
               [0, 0, 1, 0],
               [0, 0, 0, -1]], dtype=np.complex128)

# SWAP gate
SWAP = np.array([[1, 0, 0, 0],
                 [0, 0, 1, 0],
                 [0, 1, 0, 0],
                 [0, 0, 0, 1]], dtype=np.complex128)


# ─── Gate Registry ──────────────────────────────────────────────────────

SINGLE_QUBIT_GATES = {
    "X": X, "Y": Y, "Z": Z,
    "H": H, "S": S, "T": T,
}

MULTI_QUBIT_GATES = {
    "CNOT": CNOT, "CZ": CZ, "SWAP": SWAP,
}

ALL_GATES = {**SINGLE_QUBIT_GATES, **MULTI_QUBIT_GATES}

GATE_INFO = [
    {"name": "X",    "num_qubits": 1, "description": "Pauli-X (NOT) gate"},
    {"name": "Y",    "num_qubits": 1, "description": "Pauli-Y gate"},
    {"name": "Z",    "num_qubits": 1, "description": "Pauli-Z gate"},
    {"name": "H",    "num_qubits": 1, "description": "Hadamard gate"},
    {"name": "S",    "num_qubits": 1, "description": "S (phase π/2) gate"},
    {"name": "T",    "num_qubits": 1, "description": "T (phase π/4) gate"},
    {"name": "CNOT", "num_qubits": 2, "description": "Controlled-NOT gate"},
    {"name": "CZ",   "num_qubits": 2, "description": "Controlled-Z gate"},
    {"name": "SWAP", "num_qubits": 2, "description": "SWAP gate"},
]


# ─── Operator Builder ──────────────────────────────────────────────────

def _kron_list(matrices: list[np.ndarray]) -> np.ndarray:
    """Compute the Kronecker (tensor) product of a list of matrices."""
    return reduce(np.kron, matrices)


def build_single_qubit_operator(
    gate_matrix: np.ndarray,
    target: int,
    num_qubits: int,
) -> np.ndarray:
    """
    Build the full 2^n × 2^n operator for a single-qubit gate
    applied to `target` qubit in an `num_qubits` system.
    """
    ops = [I] * num_qubits
    ops[target] = gate_matrix
    return _kron_list(ops)


def build_two_qubit_operator(
    gate_matrix: np.ndarray,
    qubit_a: int,
    qubit_b: int,
    num_qubits: int,
) -> np.ndarray:
    """
    Build the full 2^n × 2^n operator for a two-qubit gate.

    For CNOT/CZ: qubit_a = control, qubit_b = target.
    For SWAP: order doesn't matter.

    Handles arbitrary qubit ordering by constructing the operator
    in the computational basis.
    """
    dim = 2 ** num_qubits
    full_op = np.zeros((dim, dim), dtype=np.complex128)

    for i in range(dim):
        # Extract bits for the two qubits
        bits = [(i >> (num_qubits - 1 - q)) & 1 for q in range(num_qubits)]
        bit_a = bits[qubit_a]
        bit_b = bits[qubit_b]

        # Index into the 4×4 gate matrix
        in_idx = bit_a * 2 + bit_b

        for out_a in range(2):
            for out_b in range(2):
                out_idx = out_a * 2 + out_b
                coeff = gate_matrix[out_idx, in_idx]
                if coeff == 0:
                    continue

                # Build output state index
                out_bits = bits.copy()
                out_bits[qubit_a] = out_a
                out_bits[qubit_b] = out_b
                j = 0
                for q in range(num_qubits):
                    j = (j << 1) | out_bits[q]

                full_op[j, i] += coeff

    return full_op
