"use client";

import { useRef, useState } from "react";

export default function QubitLabel({
  qubit,
  label,
  onChange,
}: {
  qubit: number;
  label: string;
  onChange: (label: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const cancelled = useRef(false);
  const button = useRef<HTMLButtonElement>(null);

  if (editing) {
    return (
      <input
        className="qubit-name-input"
        aria-label={`Label for qubit ${qubit}`}
        title="Enter to save · Escape to cancel · Leave empty to remove"
        defaultValue={label}
        maxLength={32}
        placeholder="Label"
        autoFocus
        autoComplete="off"
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={(event) => {
          const value = event.currentTarget.value.trim();
          setEditing(false);
          if (!cancelled.current && value !== label) onChange(value);
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.nativeEvent.isComposing) return;
          if (event.key !== "Enter" && event.key !== "Escape") return;
          event.preventDefault();
          cancelled.current = event.key === "Escape";
          event.currentTarget.blur();
          requestAnimationFrame(() => button.current?.focus());
        }}
      />
    );
  }

  return (
    <button
      ref={button}
      type="button"
      className={`qubit-name-button ${label ? "has-label" : ""}`}
      aria-label={`${label ? "Edit" : "Add"} label for qubit ${qubit}${label ? `: ${label}` : ""}`}
      title={label ? `${label} · Click to edit` : "Add a label to this qubit"}
      onClick={() => {
        cancelled.current = false;
        setEditing(true);
      }}
    >
      {label || "+ label"}
    </button>
  );
}
