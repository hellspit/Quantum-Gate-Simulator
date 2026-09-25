"use client";
import { useState } from "react";
import { GATES } from "../lib/gateData";
import Icon from "./Icon";

export default function GateToolbar({
  onSelectGate,
  selectedGate,
}: {
  onSelectGate: (gate: string) => void;
  selectedGate: string | null;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const current = GATES.find((g) => g.name === (hovered ?? selectedGate));
  return (
    <aside className="gate-toolbar" aria-label="Gate library">
      <div className="palette-heading">
        <h2>Gates</h2>
        <span className="mono">{String(GATES.length).padStart(2, "0")}</span>
      </div>
      <p className="palette-caption">Select or drag onto a wire</p>
      {[1, 2, 3].map((count) => (
        <div className="gate-group" key={count}>
          <h3 className="eyebrow">
            {count === 1
              ? "Single qubit"
              : count === 2
                ? "Two qubit"
                : "Three qubit"}
          </h3>
          <div className="gate-buttons">
            {GATES.filter((g) => g.qubits === count).map((gate) => (
              <button
                type="button"
                key={gate.name}
                draggable
                className={`gate-btn family-${gate.family} ${selectedGate === gate.name ? "gate-btn-active" : ""}`}
                onClick={() => onSelectGate(gate.name)}
                onMouseEnter={() => setHovered(gate.name)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(gate.name)}
                onBlur={() => setHovered(null)}
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    "application/quantum-gate",
                    gate.name,
                  );
                  event.dataTransfer.effectAllowed = "copy";
                }}
                aria-label={`${gate.title}. ${gate.description}`}
                aria-pressed={selectedGate === gate.name}
                title={`${gate.title}${gate.shortcut ? ` · ${gate.shortcut}` : ""}`}
              >
                <span className="gate-glyph">{gate.label}</span>
                <span className="gate-name">
                  {gate.name === "CNOT" ? "CNOT" : gate.title.split(" ").at(-1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="gate-explainer" aria-live="polite">
        <Icon name="info" size={15} />
        <div>
          <strong>{current?.title ?? "A gate is a transformation"}</strong>
          <p>
            {current?.description ??
              "Hover over a gate to explore what it does. Select one to start building."}
          </p>
        </div>
      </div>
      <div className="palette-foot">
        <span className="small-dot" />
        Unitary operations
      </div>
    </aside>
  );
}
export function isMultiQubitGate(name: string) {
  return GATES.some((g) => g.name === name && g.qubits > 1);
}
export function getGateLabel(name: string) {
  return GATES.find((g) => g.name === name)?.label ?? name;
}
export type NodeKind = "box" | "control" | "target" | "swap";
export function getNodeKind(
  name: string,
  role: "control" | "target",
): NodeKind {
  if (name === "SWAP") return "swap";
  if (name === "CZ") return "control";
  if (name === "CNOT" || name === "CCNOT") return role;
  return "box";
}
