"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Icon from "./Icon";

export default function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const library = path.startsWith("/circuits");
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to workspace
      </a>
      <header className="site-header">
        <Link
          className="brand"
          href="/"
          aria-label="Quantum Gate Simulator home"
        >
          <span className="brand-symbol">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                d="M16 3 28 10v12l-12 7-12-7V10Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="m4 10 12 7 12-7M16 17v12M16 3v8m-6 2 6-3 6 3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </span>
          <span>
            quantum<span className="brand-divider">/</span>
            <span className="brand-light">lab</span>
          </span>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          <Link
            href="/"
            className={!library ? "active" : ""}
            aria-current={!library ? "page" : undefined}
          >
            <Icon name="circuit" size={16} />
            Workspace
          </Link>
          <Link
            href="/circuits"
            className={library ? "active" : ""}
            aria-current={library ? "page" : undefined}
          >
            <Icon name="library" size={16} />
            Circuit library
          </Link>
        </nav>
        <span className="header-engine">
          <span className="status-dot" />
          State-vector simulator<span className="version-tag">v0.1</span>
        </span>
      </header>
      {children}
      <footer className="site-footer">
        <span>QUANTUM GATE SIMULATOR</span>
        <span>Built for curiosity. Grounded in quantum mechanics.</span>
        <span>01–10 QUBITS</span>
      </footer>
    </div>
  );
}
