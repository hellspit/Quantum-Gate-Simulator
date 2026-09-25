"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SimulationResult } from "../types/circuit";
import BlochSphere, {
  type BlochViewControls,
  type ViewDirection,
} from "./BlochSphere";
import Icon from "./Icon";

type RegisterView = (qubit: number, view: BlochViewControls) => () => void;

function QubitCard({
  qubit,
  label,
  vector,
  focused,
  hidden,
  onFocus,
  registerView,
  onRotate,
}: {
  qubit: number;
  label?: string;
  vector: [number, number, number];
  focused: boolean;
  hidden: boolean;
  onFocus: (qubit: number) => void;
  registerView: RegisterView;
  onRotate: (qubit: number, direction: ViewDirection) => void;
}) {
  const view = useRef<BlochViewControls | null>(null);
  const onViewReady = useCallback(
    (controls: BlochViewControls) => {
      view.current = controls;
      const unregister = registerView(qubit, controls);
      return () => {
        view.current = null;
        unregister();
      };
    },
    [qubit, registerView],
  );
  const handleRotate = useCallback(
    (direction: ViewDirection) => onRotate(qubit, direction),
    [onRotate, qubit],
  );
  const length = Math.hypot(...vector);
  const mixed = length < 0.999;
  return (
    <article
      className={`bloch-explorer-card ${focused ? "is-focused" : ""}`}
      hidden={hidden}
      aria-label={`Qubit ${qubit}${label ? `: ${label}` : ""}`}
    >
      <div className="explorer-card-header">
        <h3>
          q<span>{qubit}</span>
        </h3>
        {label && (
          <span className="explorer-qubit-name" title={label}>
            {label}
          </span>
        )}
        <span className={`state-pill ${mixed ? "mixed-state" : ""}`}>
          {mixed ? "Mixed state" : "Pure state"}
        </span>
        {!focused && (
          <button
            className="icon-button"
            onClick={() => onFocus(qubit)}
            aria-label={`Enlarge qubit ${qubit}`}
            title="Inspect this qubit"
          >
            <Icon name="expand" size={15} />
          </button>
        )}
      </div>
      <BlochSphere
        rx={vector[0]}
        ry={vector[1]}
        rz={vector[2]}
        qubitLabel={String(qubit)}
        expanded
        onViewReady={onViewReady}
        onRotate={handleRotate}
      />
      <div
        className="explorer-camera-tools"
        aria-label={`Camera controls for qubit ${qubit}`}
      >
        <span>VIEW</span>
        <button
          className="icon-button"
          onClick={() => view.current?.zoom(1.18)}
          aria-label={`Zoom out qubit ${qubit}`}
          title="Zoom out"
        >
          <Icon name="minus" size={15} />
        </button>
        <button
          className="icon-button"
          onClick={() => view.current?.zoom(1 / 1.18)}
          aria-label={`Zoom in qubit ${qubit}`}
          title="Zoom in"
        >
          <Icon name="plus" size={15} />
        </button>
      </div>
      <dl className="explorer-coordinates">
        {vector.map((value, index) => (
          <div key={index}>
            <dt>{["X", "Y", "Z"][index]}</dt>
            <dd>{value.toFixed(3)}</dd>
          </div>
        ))}
        <div>
          <dt title="Bloch vector length">|r|</dt>
          <dd>{Math.min(1, length).toFixed(3)}</dd>
        </div>
      </dl>
      <p className="explorer-state-note">
        {mixed ? "Entangled with the register" : "On the sphere surface"}
      </p>
    </article>
  );
}

export default function BlochExplorer({
  result,
  qubitLabels = [],
  stale,
  isRunning,
  onClose,
}: {
  result: SimulationResult;
  qubitLabels?: string[];
  stale: boolean;
  isRunning: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const backdropPress = useRef(false);
  const views = useRef(new Map<number, BlochViewControls>());
  const linked = useRef(false);
  const lastDirection = useRef<ViewDirection | null>(null);
  const [linkRotations, setLinkRotations] = useState(false);
  const [focusedQubit, setFocusedQubit] = useState<number | null>(null);
  const focused =
    focusedQubit !== null && focusedQubit < result.num_qubits
      ? focusedQubit
      : null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0)
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    document.body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const registerView = useCallback<RegisterView>((qubit, view) => {
    views.current.set(qubit, view);
    if (linked.current && lastDirection.current)
      view.setDirection(lastDirection.current);
    return () => {
      if (views.current.get(qubit) === view) views.current.delete(qubit);
    };
  }, []);
  const rotate = useCallback((qubit: number, direction: ViewDirection) => {
    lastDirection.current = direction;
    if (linked.current)
      views.current.forEach((view, id) => {
        if (id !== qubit) view.setDirection(direction);
      });
  }, []);
  function toggleLinked(checked: boolean) {
    linked.current = checked;
    setLinkRotations(checked);
    if (checked && lastDirection.current)
      views.current.forEach((view) =>
        view.setDirection(lastDirection.current!),
      );
  }
  function resetViews() {
    lastDirection.current = null;
    views.current.forEach((view) => view.reset());
  }
  function focusQubit(qubit: number) {
    setFocusedQubit(qubit);
    requestAnimationFrame(() => backButton.current?.focus());
  }
  function showAll() {
    const previous = focused;
    setFocusedQubit(null);
    requestAnimationFrame(() =>
      dialog.current
        ?.querySelector<HTMLButtonElement>(
          `[aria-label="Enlarge qubit ${previous}"]`,
        )
        ?.focus(),
    );
  }

  return createPortal(
    <dialog
      ref={dialog}
      className="bloch-explorer"
      aria-labelledby="bloch-explorer-title"
      aria-describedby="bloch-explorer-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key !== "Tab") return;
        const focusable = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onPointerDown={(event) => {
        backdropPress.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || !backdropPress.current)
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <header className="explorer-header">
        <div>
          <span className="eyebrow">State explorer / Bloch spheres</span>
          <h2 id="bloch-explorer-title">A closer look at every qubit.</h2>
          <p id="bloch-explorer-description">
            Explore the{" "}
            {result.num_qubits === 1 ? "qubit" : `${result.num_qubits} qubits`}{" "}
            in your simulation. Rotate a sphere to see it from any angle.
          </p>
        </div>
        <button
          ref={closeButton}
          className="explorer-close"
          onClick={onClose}
          aria-label="Close Bloch sphere explorer"
        >
          <Icon name="close" size={21} />
          <kbd>Esc</kbd>
        </button>
      </header>
      <div className="explorer-toolbar">
        <div className="explorer-view-label">
          {focused === null ? (
            <>
              <span className="small-dot" />
              All qubits
              <span className="explorer-count">
                {String(result.num_qubits).padStart(2, "0")}
              </span>
            </>
          ) : (
            <button ref={backButton} className="text-button" onClick={showAll}>
              <Icon
                name="arrow"
                size={15}
                style={{ transform: "rotate(180deg)" }}
              />
              Back to all qubits
            </button>
          )}
        </div>
        <div className="explorer-options">
          <label className="link-rotations">
            <input
              type="checkbox"
              checked={linkRotations}
              onChange={(event) => toggleLinked(event.target.checked)}
            />
            <span className="toggle-track" aria-hidden="true" />
            Link rotations
          </label>
          <span className="toolbar-separator" />
          <button className="text-button" onClick={resetViews}>
            <Icon name="reset" size={15} />
            Reset views
          </button>
        </div>
      </div>
      {(stale || isRunning) && (
        <div className="explorer-stale" role="status">
          <Icon name="info" size={16} />
          <span>
            {isRunning
              ? "Simulation running — showing the previous run until it finishes."
              : "Previous run — circuit changed. Close this view and run again to update the spheres."}
          </span>
        </div>
      )}
      <div className="explorer-scroll">
        <div
          className={`explorer-grid ${focused !== null ? "explorer-grid-focused" : ""} ${result.num_qubits === 1 ? "explorer-grid-single" : ""}`}
        >
          {Array.from({ length: result.num_qubits }, (_, qubit) => (
            <QubitCard
              key={qubit}
              qubit={qubit}
              label={qubitLabels[qubit]}
              vector={result.bloch_vectors[String(qubit)] ?? [0, 0, 1]}
              focused={focused === qubit}
              hidden={focused !== null && focused !== qubit}
              onFocus={focusQubit}
              registerView={registerView}
              onRotate={rotate}
            />
          ))}
        </div>
      </div>
      <footer className="explorer-footer">
        <span>
          <Icon name="info" size={14} />
          Drag to rotate · Scroll or pinch to zoom
        </span>
        <span>The view changes. Your quantum state stays the same.</span>
      </footer>
    </dialog>,
    document.body,
  );
}
