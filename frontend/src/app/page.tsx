"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import type { GateOperation, SimulationResult } from "./types/circuit";
import { simulateCircuit } from "./lib/api";
import { isMultiQubitGate } from "./components/GateToolbar";
import GateToolbar from "./components/GateToolbar";
import CircuitBuilder from "./components/CircuitBuilder";
import SimulationControls from "./components/SimulationControls";
import ResultDashboard from "./components/ResultDashboard";
import ExampleCircuits from "./components/ExampleCircuits";

let nextId = 0;
function genId() {
  return `op-${nextId++}`;
}

export default function Home() {
  const [numQubits, setNumQubits] = useState(2);
  const [initialStates, setInitialStates] = useState<number[]>([0, 0]);
  const [operations, setOperations] = useState<GateOperation[]>([]);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [pendingControl, setPendingControl] = useState<{
    gate: string;
    control: number;
    step: number;
  } | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectGate = useCallback(
    (gateName: string) => {
      if (selectedGate === gateName) {
        setSelectedGate(null);
        setPendingControl(null);
      } else {
        setSelectedGate(gateName);
        setPendingControl(null);
      }
    },
    [selectedGate]
  );

  const handlePlaceGate = useCallback(
    (qubit: number, step: number) => {
      if (!selectedGate) return;

      if (isMultiQubitGate(selectedGate)) {
        if (!pendingControl) {
          setPendingControl({ gate: selectedGate, control: qubit, step });
        } else {
          if (qubit === pendingControl.control) return;
          const op: GateOperation = {
            id: genId(),
            gate: pendingControl.gate,
            target: qubit,
            control: pendingControl.control,
            step: pendingControl.step,
          };
          setOperations((prev) => [...prev, op]);
          setPendingControl(null);
        }
      } else {
        const op: GateOperation = {
          id: genId(),
          gate: selectedGate,
          target: qubit,
          control: null,
          step,
        };
        setOperations((prev) => [...prev, op]);
      }
    },
    [selectedGate, pendingControl]
  );

  const handleRemoveGate = useCallback((id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  }, []);

  const handleAddQubit = useCallback(() => {
    setNumQubits((n) => {
      const newN = Math.min(n + 1, 10);
      setInitialStates((prev) => {
        if (newN > prev.length) return [...prev, 0];
        return prev;
      });
      return newN;
    });
  }, []);

  const handleRemoveQubit = useCallback(() => {
    setNumQubits((n) => {
      const newN = Math.max(n - 1, 1);
      setOperations((ops) =>
        ops.filter(
          (op) =>
            op.target < newN &&
            (op.control === null || op.control === undefined || op.control < newN)
        )
      );
      setInitialStates((prev) => prev.slice(0, newN));
      return newN;
    });
  }, []);

  const handleReset = useCallback(() => {
    setOperations([]);
    setResult(null);
    setError(null);
    setPendingControl(null);
    setInitialStates((prev) => Array(prev.length).fill(0));
  }, []);

  const handleToggleInitialState = useCallback((qubit: number) => {
    setInitialStates((prev) => {
      const next = [...prev];
      next[qubit] = next[qubit] === 0 ? 1 : 0;
      return next;
    });
  }, []);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    try {
      const sorted = [...operations].sort((a, b) => a.step - b.step);
      const res = await simulateCircuit(numQubits, initialStates, sorted);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setIsRunning(false);
    }
  }, [initialStates, numQubits, operations]);

  const handleLoadExample = useCallback(
    (exNumQubits: number, exOps: Omit<GateOperation, "id">[]) => {
      setNumQubits(exNumQubits);
      setInitialStates(Array(exNumQubits).fill(0));
      setOperations(exOps.map((op) => ({ ...op, id: genId() })));
      setResult(null);
      setError(null);
      setPendingControl(null);
      setSelectedGate(null);
    },
    []
  );

  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-row">
          <div className="header-content">
            <div className="header-icon">⚛</div>
            <div>
              <h1 className="app-title">Quantum Gate Simulator</h1>
              <p className="app-subtitle">
                Build circuits, simulate quantum states, visualize results
              </p>
            </div>
          </div>
          <Link href="/circuits" className="header-link-btn">
            Circuit Library →
          </Link>
        </div>
      </header>

      <GateToolbar onSelectGate={handleSelectGate} selectedGate={selectedGate} />

      <div className="main-content">
        <div className="circuit-area">
          <CircuitBuilder
            numQubits={numQubits}
            initialStates={initialStates}
            operations={operations}
            selectedGate={selectedGate}
            onAddQubit={handleAddQubit}
            onRemoveQubit={handleRemoveQubit}
            onPlaceGate={handlePlaceGate}
            onRemoveGate={handleRemoveGate}
            onReset={handleReset}
            onToggleInitialState={handleToggleInitialState}
            pendingControl={pendingControl}
          />
          <SimulationControls
            onRun={handleRun}
            isRunning={isRunning}
            error={error}
            hasOperations={operations.length > 0}
          />
        </div>

        <div className="results-area">
          <ResultDashboard result={result} />
        </div>
      </div>

      <ExampleCircuits onLoadExample={handleLoadExample} />
    </main>
  );
}
