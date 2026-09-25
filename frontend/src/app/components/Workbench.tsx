"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  Circuit,
  GateOperation,
  SimulationResult,
} from "../types/circuit";
import type { PrebuiltCircuit } from "../lib/circuitData";
import { simulateCircuit } from "../lib/api";
import { GATES } from "../lib/gateData";
import GateToolbar, { isMultiQubitGate } from "./GateToolbar";
import CircuitBuilder from "./CircuitBuilder";
import SimulationControls from "./SimulationControls";
import ResultDashboard from "./ResultDashboard";
import ExampleCircuits from "./ExampleCircuits";
import Icon from "./Icon";

interface Draft extends Circuit {
  name: string;
  qubit_labels: string[];
}
interface History {
  past: Draft[];
  present: Draft;
  future: Draft[];
}
export interface PendingGate {
  gate: string;
  control: number;
  control2?: number;
  step: number;
}
const signature = (draft: Draft) =>
  JSON.stringify([
    draft.num_qubits,
    draft.initial_states,
    draft.operations.map(({ gate, target, control, control2, step }) => ({
      gate,
      target,
      control,
      control2,
      step,
    })),
  ]);

export default function Workbench({
  preset,
  isLibrary = false,
}: {
  preset?: PrebuiltCircuit;
  isLibrary?: boolean;
}) {
  const libraryPreset = isLibrary ? preset : undefined;
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    future: [],
    present: {
      name: preset?.name ?? "Untitled circuit",
      num_qubits: preset?.qubits ?? 2,
      initial_states: [...(preset?.initialStates ?? [0, 0])],
      qubit_labels: Array.from(
        { length: preset?.qubits ?? 2 },
        (_, i) => preset?.qubitLabels?.[i] ?? "",
      ),
      operations: (preset?.operations ?? []).map((op, i) => ({
        ...op,
        id: `initial-${i}`,
      })),
    },
  }));
  const draft = history.present;
  const registerPreset =
    libraryPreset?.name === draft.name &&
    libraryPreset.qubits === draft.num_qubits
      ? libraryPreset
      : undefined;
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [pendingControl, setPendingControl] = useState<PendingGate | null>(
    null,
  );
  const [shots, setShots] = useState(1024);
  const [run, setRun] = useState<{
    result: SimulationResult;
    signature: string;
    shots: number;
    duration: number;
    qubitLabels: string[];
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const stale =
    !!run && (run.signature !== signature(draft) || run.shots !== shots);

  const commit = useCallback((change: (current: Draft) => Draft) => {
    setHistory((current) => ({
      past: [...current.past.slice(-59), current.present],
      present: change(current.present),
      future: [],
    }));
    setPendingControl(null);
    setError(null);
  }, []);
  const undo = useCallback(() => {
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future],
          }
        : h,
    );
    setPendingControl(null);
    setError(null);
  }, []);
  const redo = useCallback(() => {
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
          }
        : h,
    );
    setPendingControl(null);
    setError(null);
  }, []);
  const selectGate = useCallback((gate: string) => {
    setSelectedGate((current) => (current === gate ? null : gate));
    setPendingControl(null);
  }, []);
  const cancel = useCallback(() => {
    setSelectedGate(null);
    setPendingControl(null);
  }, []);
  const placeGate = useCallback(
    (qubit: number, step: number, droppedGate?: string) => {
      const gate = droppedGate ?? selectedGate;
      if (
        !gate ||
        !GATES.some((g) => g.name === gate) ||
        qubit >= draft.num_qubits
      )
        return;
      if (
        draft.operations.some(
          (op) =>
            op.step === step &&
            (op.target === qubit ||
              op.control === qubit ||
              op.control2 === qubit),
        )
      )
        return;
      const pending = droppedGate ? null : pendingControl;
      if (isMultiQubitGate(gate) && !pending) {
        setSelectedGate(gate);
        setPendingControl({ gate, control: qubit, step });
        return;
      }
      if (
        pending &&
        (step !== pending.step ||
          qubit === pending.control ||
          qubit === pending.control2 ||
          pending.control >= draft.num_qubits ||
          (pending.control2 != null && pending.control2 >= draft.num_qubits))
      )
        return;
      if (gate === "CCNOT" && pending && pending.control2 == null) {
        setPendingControl({ ...pending, control2: qubit });
        return;
      }
      const op: GateOperation = {
        gate,
        target: qubit,
        control: pending?.control ?? null,
        control2: pending?.control2 ?? null,
        step,
        id: crypto.randomUUID(),
      };
      commit((current) => ({
        ...current,
        name: "Custom circuit",
        operations: [...current.operations, op],
      }));
    },
    [commit, draft.num_qubits, draft.operations, pendingControl, selectedGate],
  );
  const handleRun = useCallback(async () => {
    if (running.current || pendingControl) return;
    running.current = true;
    setIsRunning(true);
    setError(null);
    const started = performance.now();
    try {
      const result = await simulateCircuit(
        draft.num_qubits,
        draft.initial_states,
        [...draft.operations].sort((a, b) => a.step - b.step),
        shots,
      );
      setRun({
        result,
        signature: signature(draft),
        shots,
        duration: Math.round(performance.now() - started),
        qubitLabels: [...draft.qubit_labels],
      });
    } catch (e) {
      setError(
        e instanceof TypeError
          ? "Could not reach the simulator. Check that the backend is running and try again."
          : e instanceof Error
            ? e.message
            : "Simulation failed. Please try again.",
      );
    } finally {
      running.current = false;
      setIsRunning(false);
    }
  }, [draft, pendingControl, shots]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "Escape") {
        cancel();
        return;
      }
      if (target.matches("input, textarea, select") || target.isContentEditable)
        return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key === "Enter") {
        event.preventDefault();
        void handleRun();
      } else if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (
        !mod &&
        !event.altKey &&
        GATES.some((g) => g.shortcut === event.key.toUpperCase())
      ) {
        event.preventDefault();
        selectGate(event.key.toUpperCase());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancel, handleRun, redo, selectGate, undo]);

  function loadExample(
    numQubits: number,
    operations: Omit<GateOperation, "id">[],
    name: string,
  ) {
    commit(() => ({
      name,
      num_qubits: numQubits,
      initial_states: Array(numQubits).fill(0),
      qubit_labels: Array(numQubits).fill(""),
      operations: operations.map((op) => ({ ...op, id: crypto.randomUUID() })),
    }));
    cancel();
  }
  function exportCircuit() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            name: draft.name,
            num_qubits: draft.num_qubits,
            initial_states: draft.initial_states,
            qubit_labels: draft.qubit_labels,
            operations: draft.operations.map(
              ({ gate, target, control, control2, step }) => ({
                gate,
                target,
                control,
                control2,
                step,
              }),
            ),
            shots,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const depth = draft.operations.length
    ? Math.max(...draft.operations.map((op) => op.step)) + 1
    : 0;
  return (
    <main className="app-container" id="main-content">
      <header className="workspace-heading">
        <div>
          <div className="eyebrow page-eyebrow">
            <span>
              01 /{" "}
              {libraryPreset ? libraryPreset.category : "Quantum workspace"}
            </span>
            <span className="eyebrow-rule" />
          </div>
          <h1>
            {libraryPreset
              ? libraryPreset.name
              : "Ideas into quantum circuits."}
          </h1>
          <p>
            {libraryPreset
              ? libraryPreset.description
              : "Build, experiment, and see what happens. One gate at a time."}
          </p>
        </div>
        <div className="workspace-spec">
          <span className="spec-mark">ψ</span>
          <div>
            <strong>Exact simulation</strong>
            <span>Up to 10 qubits · {GATES.length} quantum gates</span>
          </div>
        </div>
      </header>
      {libraryPreset && (
        <details className="circuit-context">
          <summary>
            <Icon name="info" size={16} />
            About this circuit<span>Read the theory</span>
          </summary>
          <p>{libraryPreset.longDescription}</p>
        </details>
      )}
      <section className="workbench" aria-label="Circuit editor">
        {registerPreset?.registerGuide && (
          <div className="circuit-register-guide">
            <p>
              <span>Inputs</span>
              {registerPreset.registerGuide.inputs}
            </p>
            <p>
              <span>Outputs</span>
              {registerPreset.registerGuide.outputs}
            </p>
          </div>
        )}
        <div className="workbench-titlebar">
          <div className="circuit-title">
            <Icon name="circuit" size={18} />
            <h2>{draft.name}</h2>
            <span className="editable-label">EDITABLE CIRCUIT</span>
          </div>
          <button className="text-button" onClick={exportCircuit}>
            <Icon name="download" size={15} />
            Export<span className="export-format"> .json</span>
          </button>
        </div>
        <div className="workbench-body">
          <GateToolbar selectedGate={selectedGate} onSelectGate={selectGate} />
          <div className="composer">
            <div className="editor-toolbar">
              <div className="qubit-controls">
                <span className="toolbar-label">Qubits</span>
                <button
                  className="icon-button"
                  onClick={() =>
                    commit((c) => ({
                      ...c,
                      num_qubits: c.num_qubits - 1,
                      initial_states: c.initial_states.slice(0, -1),
                      qubit_labels: c.qubit_labels.slice(0, -1),
                      operations: c.operations.filter(
                        (op) =>
                          op.target < c.num_qubits - 1 &&
                          (op.control == null ||
                            op.control < c.num_qubits - 1) &&
                          (op.control2 == null ||
                            op.control2 < c.num_qubits - 1),
                      ),
                    }))
                  }
                  disabled={draft.num_qubits <= 1}
                  aria-label="Remove qubit"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span className="qubit-count">
                  {String(draft.num_qubits).padStart(2, "0")}
                </span>
                <button
                  className="icon-button"
                  onClick={() =>
                    commit((c) => ({
                      ...c,
                      num_qubits: c.num_qubits + 1,
                      initial_states: [...c.initial_states, 0],
                      qubit_labels: [...c.qubit_labels, ""],
                    }))
                  }
                  disabled={draft.num_qubits >= 10}
                  aria-label="Add qubit"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
              <div className="editor-actions">
                <button
                  className="icon-button"
                  onClick={undo}
                  disabled={!history.past.length}
                  aria-label="Undo"
                  title="Undo · Ctrl/Cmd Z"
                >
                  <Icon name="undo" size={16} />
                </button>
                <button
                  className="icon-button"
                  onClick={redo}
                  disabled={!history.future.length}
                  aria-label="Redo"
                  title="Redo · Ctrl/Cmd Shift Z"
                >
                  <Icon name="redo" size={16} />
                </button>
                <span className="toolbar-separator" />
                <button
                  className="text-button clear-button"
                  onClick={() =>
                    commit((c) => ({
                      ...c,
                      name: "Untitled circuit",
                      operations: [],
                      initial_states: Array(c.num_qubits).fill(0),
                    }))
                  }
                  disabled={
                    !draft.operations.length &&
                    draft.initial_states.every((s) => s === 0)
                  }
                >
                  <Icon name="trash" size={15} />
                  Clear
                </button>
              </div>
            </div>
            <CircuitBuilder
              numQubits={draft.num_qubits}
              qubitLabels={draft.qubit_labels}
              onLabelChange={(qubit, label) =>
                commit((c) => ({
                  ...c,
                  qubit_labels: c.qubit_labels.map((value, i) =>
                    i === qubit ? label : value,
                  ),
                }))
              }
              initialStates={draft.initial_states}
              operations={draft.operations}
              selectedGate={selectedGate}
              pendingControl={pendingControl}
              onPlaceGate={placeGate}
              onRemoveGate={(id) =>
                commit((c) => ({
                  ...c,
                  name: "Custom circuit",
                  operations: c.operations.filter((op) => op.id !== id),
                }))
              }
              onToggleInitialState={(qubit) =>
                commit((c) => ({
                  ...c,
                  initial_states: c.initial_states.map((state, i) =>
                    i === qubit ? 1 - state : state,
                  ),
                }))
              }
              onCancelSelection={cancel}
            />
            <div className="circuit-statusbar">
              <span>
                <span className="status-dot" />
                {draft.operations.length} gates
                <span className="status-divider">/</span>Depth {depth}
                <span className="status-divider">/</span>
                {2 ** draft.num_qubits} basis states
              </span>
              <span className="flow-direction">
                TIME FLOWS LEFT TO RIGHT <Icon name="arrow" size={15} />
              </span>
            </div>
            <SimulationControls
              onRun={handleRun}
              isRunning={isRunning}
              error={error}
              shots={shots}
              onShotsChange={setShots}
              pending={!!pendingControl}
            />
          </div>
        </div>
      </section>
      <ExampleCircuits onLoadExample={loadExample} activeName={draft.name} />
      <div className="section-heading">
        <div>
          <span className="section-index">02</span>
          <h2>Observe the outcome</h2>
        </div>
        <span
          className={stale ? "results-stale" : "results-state"}
          aria-live="polite"
        >
          {isRunning
            ? "Computing…"
            : stale
              ? "Circuit changed · run again to update"
              : run
                ? `Completed in ${run.duration} ms`
                : "Your results will appear here"}
        </span>
      </div>
      <ResultDashboard
        result={run?.result ?? null}
        qubitLabels={
          run?.signature === signature(draft)
            ? draft.qubit_labels
            : run?.qubitLabels
        }
        stale={stale}
        isRunning={isRunning}
      />
      <div className="workspace-bottom">
        <span>
          <kbd>H</kbd>–<kbd>T</kbd> Select gate{" "}
          <span className="shortcut-gap">
            <kbd>Esc</kbd> Cancel
          </span>
          <span className="shortcut-gap">
            <kbd>Ctrl / ⌘</kbd> + <kbd>↵</kbd> Run
          </span>
        </span>
        <Link href="/circuits">
          Explore the circuit library <Icon name="arrow" size={16} />
        </Link>
      </div>
    </main>
  );
}
