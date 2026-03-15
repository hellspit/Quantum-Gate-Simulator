"use client";

import React from "react";
import type { SimulationResult } from "../types/circuit";
import BlochSphere from "./BlochSphere";

interface ResultDashboardProps {
  result: SimulationResult | null;
}

export default function ResultDashboard({ result }: ResultDashboardProps) {
  if (!result) {
    return (
      <div className="result-dashboard result-empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>Build a circuit and click <strong>Run</strong> to see results</p>
        </div>
      </div>
    );
  }

  // Sort probabilities by key
  const sortedProbs = Object.entries(result.probabilities).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const maxProb = Math.max(...sortedProbs.map(([, p]) => p));

  // Sort measurements by key
  const sortedMeasurements = Object.entries(result.measurements).sort(
    ([a], [b]) => a.localeCompare(b)
  );
  const totalShots = sortedMeasurements.reduce((sum, [, c]) => sum + c, 0);
  const maxCount = Math.max(...sortedMeasurements.map(([, c]) => c));

  return (
    <div className="result-dashboard">
      {/* Bloch Spheres */}
      {result.bloch_vectors && (
        <div className="result-section">
          <h3 className="result-title">Qubit States (Bloch Spheres)</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem"
            }}
          >
            {Array.from({ length: result.num_qubits }).map((_, i) => {
              const vector = result.bloch_vectors[i.toString()] || [0, 0, 1];
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <BlochSphere rx={vector[0]} ry={vector[1]} rz={vector[2]} qubitLabel={i.toString()} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Probability Distribution */}
      <div className="result-section">
        <h3 className="result-title">Probability Distribution</h3>
        <div className="histogram">
          {sortedProbs.map(([label, prob]) => (
            <div key={label} className="hist-row">
              <span className="hist-label">|{label}⟩</span>
              <div className="hist-bar-track">
                <div
                  className="hist-bar"
                  style={{ width: `${(prob / maxProb) * 100}%` }}
                />
              </div>
              <span className="hist-value">{(prob * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Measurement Results */}
      <div className="result-section">
        <h3 className="result-title">Measurement Results ({totalShots} shots)</h3>
        <div className="histogram">
          {sortedMeasurements.map(([label, count]) => (
            <div key={label} className="hist-row">
              <span className="hist-label">|{label}⟩</span>
              <div className="hist-bar-track">
                <div
                  className="hist-bar hist-bar-measurement"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="hist-value">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* State Vector */}
      <div className="result-section">
        <h3 className="result-title">State Vector</h3>
        <div className="state-vector-table">
          <div className="sv-header">
            <span>Basis State</span>
            <span>Amplitude</span>
            <span>Probability</span>
          </div>
          {result.state_vector.map((entry) => {
            const magnitude = Math.sqrt(
              entry.real * entry.real + entry.imag * entry.imag
            );
            const prob = magnitude * magnitude;
            const amplitudeStr =
              entry.imag === 0
                ? entry.real.toFixed(4)
                : entry.real === 0
                  ? `${entry.imag.toFixed(4)}i`
                  : `${entry.real.toFixed(4)} ${entry.imag >= 0 ? "+" : "−"} ${Math.abs(entry.imag).toFixed(4)}i`;

            return (
              <div key={entry.label} className="sv-row">
                <span className="sv-label">|{entry.label}⟩</span>
                <span className="sv-amplitude">{amplitudeStr}</span>
                <span className="sv-prob">{(prob * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
