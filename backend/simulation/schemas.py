"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, Field


class GateOperation(BaseModel):
    """A single gate operation in a circuit."""
    gate: str = Field(..., description="Gate name (X, Y, Z, H, S, T, CNOT, CZ, SWAP)")
    target: int = Field(..., ge=0, description="Target qubit index")
    control: int | None = Field(None, ge=0, description="Control qubit index (for multi-qubit gates)")


class CircuitRequest(BaseModel):
    """Request body for circuit simulation."""
    num_qubits: int = Field(..., ge=1, le=10, description="Number of qubits (1-10)")
    initial_states: list[int] = Field(default_factory=list, description="Initial state (0 or 1) for each qubit. Defaults to all 0s.")
    operations: list[GateOperation] = Field(default_factory=list, description="Ordered list of gate operations")
    shots: int = Field(default=1024, ge=1, le=10000, description="Number of measurement shots")


class StateVectorEntry(BaseModel):
    """Single entry in the state vector output."""
    label: str
    real: float
    imag: float


class SimulationResult(BaseModel):
    """Response body after circuit simulation."""
    state_vector: list[StateVectorEntry]
    probabilities: dict[str, float]
    measurements: dict[str, int]
    bloch_vectors: dict[str, list[float]]
    num_qubits: int


class GateInfo(BaseModel):
    """Information about a supported gate."""
    name: str
    num_qubits: int
    description: str
