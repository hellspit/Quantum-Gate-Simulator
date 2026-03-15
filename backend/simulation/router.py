"""
API routes for quantum simulation.
"""

from fastapi import APIRouter, HTTPException
from .schemas import CircuitRequest, SimulationResult, GateInfo, StateVectorEntry
from .engine import QuantumSimulator
from .gates import GATE_INFO

router = APIRouter(prefix="/api", tags=["simulation"])


@router.post("/simulate", response_model=SimulationResult)
async def simulate_circuit(request: CircuitRequest):
    """
    Simulate a quantum circuit.

    Accepts a circuit definition and returns the final state vector,
    measurement probabilities, and simulated measurement results.
    """
    try:
        sim = QuantumSimulator(request.num_qubits)

        for op in request.operations:
            sim.apply_gate(
                gate_name=op.gate,
                target=op.target,
                control=op.control,
            )

        state_vector = [
            StateVectorEntry(**entry) for entry in sim.get_state_vector()
        ]
        probabilities = sim.get_probabilities()
        measurements = sim.measure(shots=request.shots)

        return SimulationResult(
            state_vector=state_vector,
            probabilities=probabilities,
            measurements=measurements,
            num_qubits=request.num_qubits,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@router.get("/gates", response_model=list[GateInfo])
async def get_gates():
    """Return the list of all supported quantum gates."""
    return [GateInfo(**info) for info in GATE_INFO]
