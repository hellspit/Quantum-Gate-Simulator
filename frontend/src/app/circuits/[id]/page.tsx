"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { GateOperation, SimulationResult } from "../../types/circuit";
import { simulateCircuit } from "../../lib/api";
import { getCircuitById } from "../../lib/circuitData";
import { isMultiQubitGate } from "../../components/GateToolbar";
import GateToolbar from "../../components/GateToolbar";
import CircuitBuilder from "../../components/CircuitBuilder";
import SimulationControls from "../../components/SimulationControls";
import ResultDashboard from "../../components/ResultDashboard";

let nextId = 0;
function genId() {
  return `op-${nextId++}`;
}

export default function CircuitDetailPage() {
  const params = useParams();
  const circuitId = params.id as string;
  const circuitData = useMemo(() => getCircuitById(circuitId), [circuitId]);

  // Initialize state from circuit data
  const [numQubits, setNumQubits] = useState(circuitData?.qubits ?? 2);
  const [initialStates, setInitialStates] = useState<number[]>(
    circuitData?.initialStates ?? [0, 0]
  );
  const [operations, setOperations] = useState<GateOperation[]>(
    () => circuitData?.operations.map((op) => ({ ...op, id: genId() })) ?? []
  );
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [pendingControl, setPendingControl] = useState<{
    gate: string;
    control: number;
    step: number;
  } | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Gate selection ───────────────────────────────────────
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

  // ─── Place gate on the circuit ────────────────────────────
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

  // ─── Remove a gate ────────────────────────────────────────
  const handleRemoveGate = useCallback((id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  }, []);

  // ─── Qubit controls ───────────────────────────────────────
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

  // ─── Reset ────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setOperations([]);
    setResult(null);
    setError(null);
    setPendingControl(null);
    setInitialStates((prev) => Array(prev.length).fill(0));
  }, []);

  // ─── Toggle initial state ────────────────────────────────
  const handleToggleInitialState = useCallback((qubit: number) => {
    setInitialStates((prev) => {
      const next = [...prev];
      next[qubit] = next[qubit] === 0 ? 1 : 0;
      return next;
    });
  }, []);

  // ─── Run simulation ───────────────────────────────────────
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
  }, [numQubits, initialStates, operations]);

  // ─── 404 ──────────────────────────────────────────────────
  if (!circuitData) {
    return (
      <main className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-icon">⚠️</div>
            <div>
              <h1 className="app-title">Circuit Not Found</h1>
              <p className="app-subtitle">The circuit &quot;{circuitId}&quot; does not exist.</p>
            </div>
          </div>
        </header>
        <Link
          href="/circuits"
          style={{
            color: "var(--accent-cyan)",
            textDecoration: "none",
            marginTop: "1rem",
            display: "inline-block",
          }}
        >
          ← Back to Circuit Library
        </Link>
      </main>
    );
  }

  return (
    <main className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">⚛</div>
          <div>
            <h1 className="app-title">{circuitData.name}</h1>
            <p className="app-subtitle">{circuitData.description}</p>
          </div>
        </div>
        <Link
          href="/circuits"
          style={{
            color: "var(--accent-cyan)",
            textDecoration: "none",
            fontSize: "0.95rem",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            transition: "all 0.2s",
          }}
        >
          ← Circuit Library
        </Link>
      </header>

      {/* Description Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0, 240, 255, 0.1)",
          borderRadius: "12px",
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.65)",
          fontSize: "0.92rem",
        }}
      >
        {circuitData.longDescription}
      </div>

      {/* Gate Toolbar */}
      <GateToolbar onSelectGate={handleSelectGate} selectedGate={selectedGate} />

      {/* Main Content */}
      <div className="main-content">
        {/* Circuit Area */}
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

        {/* Results Area */}
        <div className="results-area">
          <ResultDashboard result={result} />
        </div>
      </div>
    </main>
  );
}
