"""
Tests for the FastAPI simulation API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestSimulateEndpoint:
    """Tests for POST /api/simulate."""

    def test_simple_simulation(self):
        response = client.post("/api/simulate", json={
            "num_qubits": 1,
            "operations": [{"gate": "X", "target": 0}],
        })
        assert response.status_code == 200
        data = response.json()
        assert data["num_qubits"] == 1
        assert "1" in data["probabilities"]
        assert data["probabilities"]["1"] == 1.0

    def test_bell_state_simulation(self):
        response = client.post("/api/simulate", json={
            "num_qubits": 2,
            "operations": [
                {"gate": "H", "target": 0},
                {"gate": "CNOT", "target": 1, "control": 0},
            ],
        })
        assert response.status_code == 200
        data = response.json()
        assert abs(data["probabilities"].get("00", 0) - 0.5) < 1e-6
        assert abs(data["probabilities"].get("11", 0) - 0.5) < 1e-6

    def test_empty_circuit(self):
        response = client.post("/api/simulate", json={
            "num_qubits": 2,
            "operations": [],
        })
        assert response.status_code == 200
        data = response.json()
        assert data["probabilities"]["00"] == 1.0

    def test_invalid_qubit_count(self):
        response = client.post("/api/simulate", json={
            "num_qubits": 0,
            "operations": [],
        })
        assert response.status_code == 422  # Pydantic validation

    def test_too_many_qubits(self):
        response = client.post("/api/simulate", json={
            "num_qubits": 11,
            "operations": [],
        })
        assert response.status_code == 422

    def test_invalid_gate_name(self):
        response = client.post("/api/simulate", json={
            "num_qubits": 1,
            "operations": [{"gate": "INVALID", "target": 0}],
        })
        assert response.status_code == 400

    def test_custom_shots(self):
        response = client.post("/api/simulate", json={
            "num_qubits": 1,
            "operations": [{"gate": "H", "target": 0}],
            "shots": 100,
        })
        assert response.status_code == 200
        data = response.json()
        total_shots = sum(data["measurements"].values())
        assert total_shots == 100


class TestGatesEndpoint:
    """Tests for GET /api/gates."""

    def test_get_gates(self):
        response = client.get("/api/gates")
        assert response.status_code == 200
        gates = response.json()
        assert len(gates) == 9
        gate_names = {g["name"] for g in gates}
        assert gate_names == {"X", "Y", "Z", "H", "S", "T", "CNOT", "CZ", "SWAP"}

    def test_gate_structure(self):
        response = client.get("/api/gates")
        gates = response.json()
        for gate in gates:
            assert "name" in gate
            assert "num_qubits" in gate
            assert "description" in gate


class TestRootEndpoint:
    """Tests for GET /."""

    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data
