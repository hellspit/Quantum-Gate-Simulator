"use client";

import React from "react";

interface SimulationControlsProps {
  onRun: () => void;
  isRunning: boolean;
  error: string | null;
  hasOperations: boolean;
}

export default function SimulationControls({
  onRun,
  isRunning,
  error,
  hasOperations,
}: SimulationControlsProps) {
  return (
    <div className="simulation-controls">
      <button
        onClick={onRun}
        disabled={isRunning || !hasOperations}
        className="run-btn"
      >
        {isRunning ? (
          <>
            <span className="spinner" />
            Simulating...
          </>
        ) : (
          <>
            <span className="play-icon">▶</span>
            Run Simulation
          </>
        )}
      </button>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}
    </div>
  );
}
