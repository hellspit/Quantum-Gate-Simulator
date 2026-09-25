"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Workbench from "../../components/Workbench";
import { getCircuitById } from "../../lib/circuitData";
import Icon from "../../components/Icon";
export default function CircuitDetailPage() {
  const params = useParams();
  const circuit = getCircuitById(params.id as string);
  if (!circuit || circuit.status !== "ready")
    return (
      <main className="app-container notfound" id="main-content">
        <span className="eyebrow">Circuit library</span>
        <h1>
          {circuit ? "This circuit is on the roadmap." : "Circuit not found."}
        </h1>
        <p>
          {circuit
            ? "Explore one of the available experiments while this one takes shape."
            : "This circuit may have moved, or the link may be incorrect."}
        </p>
        <Link className="button-secondary" href="/circuits">
          Back to library <Icon name="arrow" />
        </Link>
      </main>
    );
  return <Workbench key={circuit.id} preset={circuit} isLibrary />;
}
