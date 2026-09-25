"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ALL_CIRCUITS } from "../lib/circuitData";
import CircuitPreview from "../components/CircuitPreview";
import Icon from "../components/Icon";
const categories = [
  "All circuits",
  ...Array.from(new Set(ALL_CIRCUITS.map((c) => c.category))),
];
const readyCount = ALL_CIRCUITS.filter(
  (circuit) => circuit.status === "ready",
).length;
export default function CircuitsPage() {
  const [category, setCategory] = useState("All circuits");
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      ALL_CIRCUITS.filter(
        (c) =>
          (category === "All circuits" || c.category === category) &&
          `${c.name} ${c.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [category, query],
  );
  const ready = filtered.filter((c) => c.status === "ready"),
    upcoming = filtered.filter((c) => c.status !== "ready");
  return (
    <main className="app-container library-page" id="main-content">
      <header className="workspace-heading">
        <div>
          <div className="eyebrow page-eyebrow">
            <span>Explore / Circuit library</span>
            <span className="eyebrow-rule" />
          </div>
          <h1>A starting point for discovery.</h1>
          <p>
            Foundational ideas, expressed in gates. Open a circuit and make it
            your own.
          </p>
        </div>
        <div className="library-totals">
          <strong>{String(readyCount).padStart(2, "0")}</strong>
          <span>
            experiments
            <br />
            ready to explore
          </span>
        </div>
      </header>
      <div className="library-tools">
        <div
          className="category-filters"
          aria-label="Filter circuits by category"
        >
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c === "Entanglement & Teleportation"
                ? "Entanglement"
                : c === "Arithmetic Circuits"
                  ? "Arithmetic"
                  : c}
            </button>
          ))}
        </div>
        <label className="library-search">
          <Icon name="search" size={16} />
          <input
            aria-label="Search circuits"
            placeholder="Find a circuit…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <Icon name="close" size={14} />
            </button>
          )}
        </label>
      </div>
      {ready.length > 0 && (
        <>
          <div className="library-group-title">
            <h2>Ready to explore</h2>
            <span className="mono">
              {String(ready.length).padStart(2, "0")} CIRCUITS
            </span>
          </div>
          <div className="library-grid">
            {ready.map((circuit, index) => (
              <Link
                className="library-card"
                href={`/circuits/${circuit.id}`}
                key={circuit.id}
              >
                <div className="library-card-top">
                  <span className="eyebrow">
                    {circuit.category.split(" & ")[0]}
                  </span>
                  <span className="library-card-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="library-preview">
                  <CircuitPreview
                    operations={circuit.operations}
                    qubits={circuit.qubits}
                  />
                </div>
                <h3>{circuit.name}</h3>
                <p>{circuit.description}</p>
                <div className="library-card-footer">
                  <span>
                    {circuit.qubits} qubits
                    <span className="status-divider">/</span>
                    {circuit.operations.length} gates
                  </span>
                  <span className="library-open">
                    Open circuit <Icon name="arrow" size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      {upcoming.length > 0 && (
        <section className="roadmap-section">
          <div className="library-group-title">
            <div>
              <h2>On the horizon</h2>
              <p>The next chapter of the library.</p>
            </div>
            <span className="mono">
              {String(upcoming.length).padStart(2, "0")} PLANNED
            </span>
          </div>
          <div className="roadmap-grid">
            {upcoming.map((circuit) => (
              <div className="roadmap-item" key={circuit.id}>
                <div>
                  <span className="eyebrow">{circuit.category}</span>
                  <h3>{circuit.name}</h3>
                  <p>{circuit.description}</p>
                </div>
                <span className="planned-badge">Planned</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {!filtered.length && (
        <div className="library-no-results">
          <Icon name="search" size={30} />
          <h2>No circuits found</h2>
          <p>Try a different search or choose another category.</p>
          <button
            className="button-secondary"
            onClick={() => {
              setQuery("");
              setCategory("All circuits");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      <div className="library-bottom">
        <span>Have an experiment in mind?</span>
        <Link href="/">
          Build it in the workspace <Icon name="arrow" size={16} />
        </Link>
      </div>
    </main>
  );
}
