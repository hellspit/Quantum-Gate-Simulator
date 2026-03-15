# Quantum Gate Simulator ⚛️

A high-performance, interactive Quantum Circuit Simulator with exact state-vector modeling and a visually rich Next.js 3D frontend.

![Quantum Gate Simulator Interface](docs/screenshot.png) <!-- Add a screenshot here later! -->

## Features

- **Up to 10 Qubits**: Exact mathematical simulation using a pure Python/NumPy state vector engine (1,024-dimensional Hilbert space).
- **Custom Initial States**: Initialize any qubit to `|0⟩` or `|1⟩` instantly by clicking its label.
- **9 Core Gates**: Apply `X`, `Y`, `Z`, `H`, `S`, `T`, `CNOT`, `CZ`, and `SWAP` gates.
- **Visual Circuit Builder**: Drag-and-drop style interface with intelligent multi-qubit routing (Control → Target connector lines).
- **3D Bloch Sphere Visualization**: Real-time rendering of qubit states on interactive 3D Bloch spheres using `Three.js`.
- **Measurement & Probability**: View histogram charts of sampling measurements (up to 10,000 shots) and exact theoretical state vectors featuring complex amplitudes.

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Engine** | Python, FastAPI, NumPy | Handles tensor calculations, gate matrix multiplications, and measurement sampling. |
| **Frontend UI** | Next.js 16, React, TypeScript | Hosts the interactive grid, drag-n-drop interface, and simulation controls. |
| **Styling** | Tailwind CSS 4 | Custom dark "Quantum" theme with neon glow and glassmorphism. |
| **3D Rendering** | React Three Fiber / Drei | Real-time interactive 3D Bloch spheres. |

---

## 🚀 Getting Started

To run the full-stack application locally, you will need to start both the Python backend API and the Next.js frontend simultaneously in two separate terminal windows.

### 1. Start the Backend API

Make sure you have Python installed.

```bash
cd backend

# Create a virtual environment (if you haven't already: python -m venv venv)
# Activate the virtual environment:
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`. You can view the automatic API docs at `http://localhost:8000/docs`.

### 2. Start the Frontend UI

Make sure you have Node.js installed. Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start building quantum circuits!

---

## Example Circuits inside the App

The frontend includes pre-built famous circuits to instantly demonstrate capabilities:
- **Superposition**: Creates an equal probability of all states using Hadamard gates.
- **Bell State**: Creates quantum entanglement between 2 qubits (EPR pair).
- **GHZ State**: Creates macroscopic quantum entanglement across 3 qubits.

## Project Architecture

- `/backend/simulation/engine.py` - Core `QuantumSimulator` class. Calculates Kronecker (tensor) products securely up to 10 qubits. Extracts exact bloch vector `(rx, ry, rz)` coordinates per-qubit.
- `/frontend/src/app/components/CircuitBuilder.tsx` - Next.js grid system handling logic for multi-qubit placement and state rendering.
- `/frontend/src/app/components/BlochSphere.tsx` - Handles the 3D `<Canvas>` mappings to render axes and vectors interactively.

## License

This is a personal project. Feel free to fork and experiment.
