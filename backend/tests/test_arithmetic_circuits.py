"""Exercise the actual library circuits, including coherent arithmetic.

CCNOT definition: https://quantum.cloud.ibm.com/docs/en/api/qiskit/2.2/qiskit.circuit.library.CCXGate
The simulator uses q0 as the most significant bit.
"""

import itertools
import json
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from main import app
from simulation.engine import QuantumSimulator


PRESETS = json.loads(
    (Path(__file__).resolve().parents[2]
     / "frontend/src/app/lib/arithmeticCircuits.json").read_text(encoding="utf-8")
)
INPUT_BITS = {"half-adder": 2, "full-adder": 3, "quantum-multiplier": 4}


def apply_operations(simulator, operations):
    for op in operations:
        simulator.apply_gate(op["gate"], op["target"], op.get("control"), op.get("control2"))


def arithmetic_output(circuit_id, input_bits):
    if circuit_id == "quantum-multiplier":
        return format(int(input_bits[:2], 2) * int(input_bits[2:], 2), "04b")
    total = sum(map(int, input_bits))
    # Adder outputs are stored as Sum, Carry, not a big-endian number.
    return f"{total % 2}{total // 2}"


CASES = [
    (circuit_id, format(value, f"0{width}b"))
    for circuit_id, width in INPUT_BITS.items()
    for value in range(2 ** width)
]


@pytest.mark.parametrize("circuit_id,input_bits", CASES)
def test_all_arithmetic_inputs(circuit_id, input_bits):
    preset = PRESETS[circuit_id]
    simulator = QuantumSimulator(
        preset["qubits"], list(map(int, input_bits)) + [0] * (preset["qubits"] - len(input_bits))
    )
    apply_operations(simulator, sorted(preset["operations"], key=lambda op: op["step"]))
    expected = np.zeros(simulator.dim, dtype=complex)
    expected[int(input_bits + arithmetic_output(circuit_id, input_bits), 2)] = 1
    np.testing.assert_allclose(simulator.state, expected, atol=1e-12)


@pytest.mark.parametrize("circuit_id", PRESETS)
def test_arithmetic_preserves_relative_phases_and_is_reversible(circuit_id):
    preset = PRESETS[circuit_id]
    width = INPUT_BITS[circuit_id]
    simulator = QuantumSimulator(preset["qubits"])
    simulator.state[:] = 0
    expected = np.zeros(simulator.dim, dtype=complex)
    for value in range(2 ** width):
        bits = format(value, f"0{width}b")
        amplitude = np.exp(0.37j * value) / np.sqrt(2 ** width)
        simulator.state[value << (preset["qubits"] - width)] = amplitude
        expected[int(bits + arithmetic_output(circuit_id, bits), 2)] = amplitude
    initial = simulator.state.copy()
    operations = sorted(preset["operations"], key=lambda op: op["step"])
    apply_operations(simulator, operations)
    np.testing.assert_allclose(simulator.state, expected, atol=1e-12)
    apply_operations(simulator, reversed(operations))
    np.testing.assert_allclose(simulator.state, initial, atol=1e-12)


@pytest.mark.parametrize("preset", PRESETS.values(), ids=PRESETS.keys())
def test_arithmetic_wires_are_valid_and_gates_do_not_overlap(preset):
    assert len(preset["qubitLabels"]) == preset["qubits"]
    occupied = set()
    for op in preset["operations"]:
        wires = [op[k] for k in ("target", "control", "control2") if op.get(k) is not None]
        assert len(set(wires)) == len(wires)
        for wire in wires:
            assert 0 <= wire < preset["qubits"]
            cell = (wire, op["step"])
            assert cell not in occupied
            occupied.add(cell)


@pytest.mark.parametrize("control,control2,target", list(itertools.permutations([0, 1, 2])) + [(4, 2, 0), (3, 0, 4)])
def test_toffoli_truth_table_in_arbitrary_wire_order(control, control2, target):
    width = max(control, control2, target) + 1
    for value in range(2 ** width):
        bits = list(map(int, format(value, f"0{width}b")))
        simulator = QuantumSimulator(width, bits)
        expected_bits = bits.copy()
        if bits[control] and bits[control2]:
            expected_bits[target] = 1 - expected_bits[target]
        simulator.apply_gate("CCNOT", target, control, control2)
        expected = np.zeros(simulator.dim, dtype=complex)
        expected[int("".join(map(str, expected_bits)), 2)] = 1
        np.testing.assert_allclose(simulator.state, expected, atol=1e-12)


@pytest.mark.parametrize("circuit_id,expected_label", [
    ("half-adder", "1101"),
    ("full-adder", "11111"),
    ("quantum-multiplier", "11100110"),
])
def test_arithmetic_presets_through_api(circuit_id, expected_label):
    preset = PRESETS[circuit_id]
    with TestClient(app) as client:
        response = client.post("/api/simulate", json={
            "num_qubits": preset["qubits"],
            "initial_states": preset["initialStates"],
            "operations": sorted(preset["operations"], key=lambda op: op["step"]),
            "shots": 32,
        })
    assert response.status_code == 200
    result = response.json()
    assert result["probabilities"] == {expected_label: 1.0}
    assert result["measurements"] == {expected_label: 32}
    for qubit, bit in enumerate(expected_label):
        assert result["bloch_vectors"][str(qubit)] == [0, 0, 1 - 2 * int(bit)]


@pytest.mark.parametrize("operation,status", [
    ({"gate": "CCNOT", "target": 2, "control": 0}, 400),
    ({"gate": "CCNOT", "target": 2, "control2": 1}, 400),
    ({"gate": "CCNOT", "target": 2, "control": 0, "control2": 0}, 400),
    ({"gate": "CCNOT", "target": 2, "control": 0, "control2": 2}, 400),
    ({"gate": "CCNOT", "target": 0, "control": 0, "control2": 1}, 400),
    ({"gate": "CCNOT", "target": 2, "control": 0, "control2": 3}, 400),
    ({"gate": "CCNOT", "target": 2, "control": 0, "control2": -1}, 422),
    ({"gate": "CNOT", "target": 2, "control": 0, "control2": 1}, 400),
])
def test_api_rejects_invalid_toffoli_wires(operation, status):
    with TestClient(app) as client:
        response = client.post("/api/simulate", json={"num_qubits": 3, "operations": [operation]})
    assert response.status_code == status


def test_toffoli_on_superposition_keeps_the_entangled_phase():
    simulator = QuantumSimulator(3)
    simulator.apply_gate("H", 0)
    simulator.apply_gate("T", 0)
    simulator.apply_gate("X", 1)
    simulator.apply_gate("CCNOT", 2, 0, 1)
    expected = np.zeros(8, dtype=complex)
    expected[2] = 1 / np.sqrt(2)
    expected[7] = np.exp(1j * np.pi / 4) / np.sqrt(2)
    np.testing.assert_allclose(simulator.state, expected, atol=1e-12)
