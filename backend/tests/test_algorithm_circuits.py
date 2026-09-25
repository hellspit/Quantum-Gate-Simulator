"""Check the actual library presets against analytical quantum states.

Definitions are shared with the frontend so these tests cannot silently drift
away from the circuits users load. Reference constructions:
https://learning.quantum.ibm.com/course/fundamentals-of-quantum-algorithms/quantum-query-algorithms
https://quantum.cloud.ibm.com/learning/en/courses/fundamentals-of-quantum-algorithms/grover-algorithm/grover-algorithm-description
"""

import json
from pathlib import Path

import numpy as np
import pytest

from simulation.engine import QuantumSimulator


PRESETS = json.loads(
    (Path(__file__).resolve().parents[2]
     / "frontend/src/app/lib/algorithmCircuits.json").read_text(encoding="utf-8")
)


def simulate(preset, operations=None):
    simulator = QuantumSimulator(preset["qubits"], preset["initialStates"])
    for operation in sorted(
        preset["operations"] if operations is None else operations,
        key=lambda item: item["step"],
    ):
        simulator.apply_gate(
            operation["gate"], operation["target"], operation.get("control")
        )
    return simulator


@pytest.mark.parametrize("circuit_id, amplitudes", [
    ("deutsch-jozsa", {"110": 1 / np.sqrt(2), "111": -1 / np.sqrt(2)}),
    ("bernstein-vazirani", {"1010": 1 / np.sqrt(2), "1011": -1 / np.sqrt(2)}),
    ("grovers-search", {"11": -1.0}),
])
def test_library_algorithm_final_state(circuit_id, amplitudes):
    simulator = simulate(PRESETS[circuit_id])
    expected = np.zeros(simulator.dim, dtype=complex)
    for label, amplitude in amplitudes.items():
        expected[int(label, 2)] = amplitude
    np.testing.assert_allclose(simulator.state, expected, atol=1e-12)


def test_deutsch_jozsa_constant_comparison():
    preset = PRESETS["deutsch-jozsa"]
    constant_oracle = [op for op in preset["operations"] if op["gate"] != "CNOT"]
    assert simulate(preset, constant_oracle).get_probabilities() == {
        "000": 0.5, "001": 0.5,
    }


def test_bernstein_vazirani_oracle_controls_the_recovered_secret():
    preset = PRESETS["bernstein-vazirani"]
    secret_100 = [
        op for op in preset["operations"]
        if not (op["gate"] == "CNOT" and op["control"] == 2)
    ]
    assert simulate(preset, secret_100).get_probabilities() == {
        "1000": 0.5, "1001": 0.5,
    }


def test_grover_oracle_marks_only_the_target_before_amplification():
    preset = PRESETS["grovers-search"]
    preparation_and_oracle = [op for op in preset["operations"] if op["step"] <= 1]
    simulator = simulate(preset, preparation_and_oracle)
    np.testing.assert_allclose(simulator.state, [0.5, 0.5, 0.5, -0.5], atol=1e-12)


@pytest.mark.parametrize("preset", PRESETS.values(), ids=PRESETS.keys())
def test_algorithm_gates_do_not_overlap_on_a_wire(preset):
    occupied = set()
    for op in preset["operations"]:
        qubits = [op["target"]]
        if op.get("control") is not None:
            qubits.append(op["control"])
        for qubit in qubits:
            cell = (qubit, op["step"])
            assert cell not in occupied, f"Two gates occupy {cell}"
            occupied.add(cell)
