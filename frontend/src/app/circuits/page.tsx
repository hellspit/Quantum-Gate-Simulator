"use client";

import React from "react";
import Link from "next/link";
import { getCircuitsByCategory } from "../lib/circuitData";

const categories = getCircuitsByCategory();

export default function CircuitsPage() {
  return (
    <main className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-icon">🔬</div>
          <div>
            <h1 className="app-title">Circuit Library</h1>
            <p className="app-subtitle">
              Pre-built quantum circuits — arithmetic, algorithms, and more
            </p>
          </div>
        </div>
        <Link
          href="/"
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
          ← Back to Simulator
        </Link>
      </header>

      {/* Circuit Categories */}
      {categories.map((category) => (
        <section key={category.title} style={{ marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              color: "var(--accent-purple)",
              marginBottom: "1rem",
              borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
              paddingBottom: "0.5rem",
            }}
          >
            {category.title}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {category.circuits.map((circuit) => {
              const isReady = circuit.status === "ready";

              const card = (
                <div
                  key={circuit.id}
                  className="glass-card"
                  style={{
                    padding: "1.25rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    background: "rgba(255, 255, 255, 0.03)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: isReady ? "pointer" : "default",
                    transition: "border-color 0.3s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = isReady
                      ? "rgba(0, 240, 255, 0.4)"
                      : "rgba(255, 255, 255, 0.1)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255, 255, 255, 0.06)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Badge */}
                  <span
                    style={{
                      position: "absolute",
                      top: "0.75rem",
                      right: "0.75rem",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: isReady
                        ? "rgba(0, 240, 255, 0.12)"
                        : "rgba(168, 85, 247, 0.15)",
                      color: isReady ? "var(--accent-cyan)" : "var(--accent-purple)",
                      border: `1px solid ${isReady ? "rgba(0, 240, 255, 0.3)" : "rgba(168, 85, 247, 0.3)"}`,
                    }}
                  >
                    {isReady ? "Try It →" : "Coming Soon"}
                  </span>

                  <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "0.5rem" }}>
                    {circuit.name}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      lineHeight: 1.5,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {circuit.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.8rem",
                      color: "rgba(0, 240, 255, 0.7)",
                    }}
                  >
                    <span>⚛ {circuit.qubits} qubits</span>
                  </div>
                </div>
              );

              if (isReady) {
                return (
                  <Link
                    key={circuit.id}
                    href={`/circuits/${circuit.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    {card}
                  </Link>
                );
              }

              return <React.Fragment key={circuit.id}>{card}</React.Fragment>;
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
