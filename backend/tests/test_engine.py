"""
Tests for the quantum simulation engine.
Verifies gate operations against known analytical results.
"""

import pytest
import numpy as np
from simulation.engine import QuantumSimulator


class TestSingleQubitGates:
    """Tests for single-qubit gate operations."""

    def test_x_gate_flips_zero_to_one(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("X", target=0)
        probs = sim.get_probabilities()
        assert probs == {"1": 1.0}

    def test_x_gate_flips_one_to_zero(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("X", target=0)  # |0⟩ → |1⟩
        sim.apply_gate("X", target=0)  # |1⟩ → |0⟩
        probs = sim.get_probabilities()
        assert probs == {"0": 1.0}

    def test_hadamard_creates_superposition(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("H", target=0)
        probs = sim.get_probabilities()
        assert abs(probs.get("0", 0) - 0.5) < 1e-6
        assert abs(probs.get("1", 0) - 0.5) < 1e-6

    def test_z_gate_phase_flip(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("H", target=0)
        sim.apply_gate("Z", target=0)
        sim.apply_gate("H", target=0)
        # H·Z·H = X, so |0⟩ → |1⟩
        probs = sim.get_probabilities()
        assert probs == {"1": 1.0}

    def test_y_gate(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("Y", target=0)
        probs = sim.get_probabilities()
        assert probs == {"1": 1.0}

    def test_s_gate(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("S", target=0)
        # S|0⟩ = |0⟩
        probs = sim.get_probabilities()
        assert probs == {"0": 1.0}

    def test_t_gate(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("T", target=0)
        # T|0⟩ = |0⟩
        probs = sim.get_probabilities()
        assert probs == {"0": 1.0}

    def test_gate_on_second_qubit(self):
        sim = QuantumSimulator(2)
        sim.apply_gate("X", target=1)
        probs = sim.get_probabilities()
        assert probs == {"01": 1.0}


class TestMultiQubitGates:
    """Tests for multi-qubit gate operations."""

    def test_cnot_no_flip_when_control_zero(self):
        sim = QuantumSimulator(2)
        # |00⟩, control=0, target=1 → no flip
        sim.apply_gate("CNOT", target=1, control=0)
        probs = sim.get_probabilities()
        assert probs == {"00": 1.0}

    def test_cnot_flips_when_control_one(self):
        sim = QuantumSimulator(2)
        sim.apply_gate("X", target=0)  # |10⟩
        sim.apply_gate("CNOT", target=1, control=0)  # |10⟩ → |11⟩
        probs = sim.get_probabilities()
        assert probs == {"11": 1.0}

    def test_bell_state(self):
        """H on qubit 0, then CNOT(0,1) creates Bell state."""
        sim = QuantumSimulator(2)
        sim.apply_gate("H", target=0)
        sim.apply_gate("CNOT", target=1, control=0)
        probs = sim.get_probabilities()
        assert abs(probs.get("00", 0) - 0.5) < 1e-6
        assert abs(probs.get("11", 0) - 0.5) < 1e-6
        assert "01" not in probs
        assert "10" not in probs

    def test_cz_gate(self):
        sim = QuantumSimulator(2)
        sim.apply_gate("X", target=0)  # |10⟩
        sim.apply_gate("X", target=1)  # |11⟩
        sim.apply_gate("CZ", target=1, control=0)  # phase flip on |11⟩
        # State should be -|11⟩, probabilities unchanged
        probs = sim.get_probabilities()
        assert probs == {"11": 1.0}

    def test_swap_gate(self):
        sim = QuantumSimulator(2)
        sim.apply_gate("X", target=0)  # |10⟩
        sim.apply_gate("SWAP", target=1, control=0)  # |10⟩ → |01⟩
        probs = sim.get_probabilities()
        assert probs == {"01": 1.0}


class TestSimulatorMethods:
    """Tests for simulator utility methods."""

    def test_reset(self):
        sim = QuantumSimulator(2)
        sim.apply_gate("X", target=0)
        sim.reset()
        probs = sim.get_probabilities()
        assert probs == {"00": 1.0}

    def test_measure_returns_valid_counts(self):
        sim = QuantumSimulator(1)
        sim.apply_gate("H", target=0)
        measurements = sim.measure(shots=1000)
        total = sum(measurements.values())
        assert total == 1000
        assert all(k in ["0", "1"] for k in measurements.keys())

    def test_get_state_vector(self):
        sim = QuantumSimulator(1)
        sv = sim.get_state_vector()
        assert len(sv) == 1
        assert sv[0]["label"] == "0"
        assert sv[0]["real"] == 1.0
        assert sv[0]["imag"] == 0.0

    def test_invalid_qubit_count(self):
        with pytest.raises(ValueError):
            QuantumSimulator(0)
        with pytest.raises(ValueError):
            QuantumSimulator(11)

    def test_unknown_gate(self):
        sim = QuantumSimulator(1)
        with pytest.raises(ValueError, match="Unknown gate"):
            sim.apply_gate("FAKE", target=0)

    def test_target_out_of_range(self):
        sim = QuantumSimulator(2)
        with pytest.raises(ValueError, match="out of range"):
            sim.apply_gate("X", target=5)

    def test_multi_gate_missing_control(self):
        sim = QuantumSimulator(2)
        with pytest.raises(ValueError, match="requires a control"):
            sim.apply_gate("CNOT", target=1)


class TestThreeQubitCircuits:
    """Tests with 3+ qubits to validate operator building."""

    def test_ghz_state(self):
        """GHZ state: H on q0, CNOT(0,1), CNOT(0,2)."""
        sim = QuantumSimulator(3)
        sim.apply_gate("H", target=0)
        sim.apply_gate("CNOT", target=1, control=0)
        sim.apply_gate("CNOT", target=2, control=0)
        probs = sim.get_probabilities()
        assert abs(probs.get("000", 0) - 0.5) < 1e-6
        assert abs(probs.get("111", 0) - 0.5) < 1e-6
        assert len(probs) == 2

    def test_gate_on_non_adjacent_qubits(self):
        """CNOT between qubit 0 and qubit 2 (non-adjacent)."""
        sim = QuantumSimulator(3)
        sim.apply_gate("X", target=0)  # |100⟩
        sim.apply_gate("CNOT", target=2, control=0)  # |100⟩ → |101⟩
        probs = sim.get_probabilities()
        assert probs == {"101": 1.0}
