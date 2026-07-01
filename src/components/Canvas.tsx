import { useStore } from "../sim/store";
import { computePositions } from "./positions";
import type { Pos } from "./positions";
import { ProducerNode, ConsumerNode, QueueNode, ExchangeNode } from "./Nodes";
import { MessageLayer } from "./MessageLayer";
import { Plus, Minus, AlertTriangle } from "lucide-react";

interface PathLabel {
  from: Pos;
  to: Pos;
  text: string;
}

export function Canvas({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const sim = useStore((s) => s.sim);
  const addProducer = useStore((s) => s.addProducer);
  const addConsumer = useStore((s) => s.addConsumer);
  const removeProducer = useStore((s) => s.removeProducer);
  const removeConsumer = useStore((s) => s.removeConsumer);
  const pos = computePositions(sim);

  const labels = computePathLabels(sim, pos);

  const fullQueues = sim.queues.filter((q) => !q.isDlq && q.depth.length >= q.capacity);
  const isFlooding = sim.flooded;

  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* toolbar */}
      <div className="flex items-stretch gap-2 lg:gap-0 w-full">
        {/* mobile: compact +/- grouped, full width */}
        <div className="lg:hidden flex items-stretch w-full gap-2">
          <div className="flex items-stretch flex-1 border-2 border-black divide-x-2 divide-black">
            <CompactIconBtn onClick={() => addProducer()} disabled={sim.producers.length >= 8} icon="plus" />
            <CompactLabel label="P" count={sim.producers.length} max={8} />
            <CompactIconBtn onClick={() => { const last = sim.producers[sim.producers.length - 1]; if (last) removeProducer(last.id); }} disabled={sim.producers.length === 0} icon="minus" accent />
          </div>
          <div className="flex items-stretch flex-1 border-2 border-black divide-x-2 divide-black">
            <CompactIconBtn onClick={() => addConsumer()} disabled={sim.consumers.length >= (sim.pattern === "simple" ? 1 : 8)} icon="plus" />
            <CompactLabel label="C" count={sim.consumers.length} max={sim.pattern === "simple" ? 1 : 8} />
            <CompactIconBtn onClick={() => { const last = sim.consumers[sim.consumers.length - 1]; if (last) removeConsumer(last.id); }} disabled={sim.consumers.length === 0} icon="minus" accent />
          </div>
        </div>

        {/* desktop: full labels */}
        <div className="hidden lg:flex items-stretch border-2 border-black divide-x-2 divide-black">
          <AddToolbarButton
            label="ADD PRODUCER"
            count={sim.producers.length}
            max={8}
            onClick={() => addProducer()}
          />
          <RemoveToolbarButton
            label="REMOVE PRODUCER"
            count={sim.producers.length}
            onClick={() => {
              const last = sim.producers[sim.producers.length - 1];
              if (last) removeProducer(last.id);
            }}
          />
          <AddToolbarButton
            label="ADD CONSUMER"
            count={sim.consumers.length}
            max={sim.pattern === "simple" ? 1 : 8}
            onClick={() => addConsumer()}
          />
          <RemoveToolbarButton
            label="REMOVE CONSUMER"
            count={sim.consumers.length}
            onClick={() => {
              const last = sim.consumers[sim.consumers.length - 1];
              if (last) removeConsumer(last.id);
            }}
          />
        </div>
      </div>

      {/* flood warning bar — latched, stays once shown */}
      {isFlooding && (
        <div className="flex items-center gap-2 px-4 py-2 bg-swiss-accent text-white border-2 border-black">
          <AlertTriangle size={16} strokeWidth={2.5} />
          <span className="font-black text-xs uppercase tracking-widest">
            {sim.droppedTotal > 0
              ? `QUEUE FLOODED / ${sim.droppedTotal} MESSAGE${sim.droppedTotal > 1 ? "S" : ""} DROPPED`
              : "BACKPRESSURE ACTIVE / PRODUCERS BLOCKED"}
          </span>
          <span className="font-medium text-xs uppercase tracking-wider opacity-80">
            {fullQueues.length > 0
              ? `${fullQueues.length} queue${fullQueues.length > 1 ? "s" : ""} at full capacity`
              : "producers were blocked"}
          </span>
        </div>
      )}

      {/* canvas */}
      <div
        className={`relative w-full flex-1 min-h-[500px] lg:min-h-[600px] border-2 bg-white swiss-grid-pattern overflow-hidden lg:overflow-visible transition-colors duration-200 ${
          isFlooding ? "border-swiss-accent" : "border-black"
        }`}
        onClick={() => onSelect(null)}
      >
      {/* connection paths */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {sim.hasExchange
          ? drawFanoutPaths(sim, pos)
          : drawDirectPaths(sim, pos)}
      </svg>

      {/* path labels — HTML, not SVG, to avoid stretch. Hidden on mobile. */}
      {labels.map((l, i) => (
        <div
          key={i}
          className="hidden lg:block absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5"
          style={{
            left: `${(l.from.x + l.to.x) / 2}%`,
            top: `${(l.from.y + l.to.y) / 2}%`,
          }}
        >
          <span className="px-1.5 py-0.5 bg-white border border-black text-[9px] font-bold uppercase tracking-widest opacity-50 whitespace-nowrap">
            {l.text}
          </span>
        </div>
      ))}

      {/* nodes */}
      {sim.producers.map((p) => (
        <ProducerNode
          key={p.id}
          p={p}
          x={pos[p.id].x}
          y={pos[p.id].y}
          selected={selected === p.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(selected === p.id ? null : p.id);
          }}
        />
      ))}

      {sim.hasExchange && (
        <ExchangeNode pattern={sim.pattern} x={pos["exchange"].x} y={pos["exchange"].y} />
      )}

      {sim.queues.map((q) => (
        <QueueNode
          key={q.id}
          q={q}
          x={pos[q.id]?.x ?? 50}
          y={pos[q.id]?.y ?? 50}
          pattern={sim.pattern}
          selected={selected === q.id}
          onClick={(e) => {
            if (q.isDlq) return;
            e.stopPropagation();
            onSelect(selected === q.id ? null : q.id);
          }}
        />
      ))}

      {sim.consumers.map((c) => (
        <ConsumerNode
          key={c.id}
          c={c}
          x={pos[c.id].x}
          y={pos[c.id].y}
          selected={selected === c.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(selected === c.id ? null : c.id);
          }}
        />
      ))}

      <MessageLayer sim={sim} pos={pos} />
      </div>
    </div>
  );
}

function CompactIconBtn({
  onClick,
  disabled,
  icon,
  accent,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: "plus" | "minus";
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center px-3 py-2 transition-colors duration-200 ease-out ${
        disabled
          ? "bg-swiss-muted opacity-40 cursor-not-allowed"
          : accent
          ? "bg-white hover:bg-swiss-accent hover:text-white"
          : "bg-white hover:bg-black hover:text-white"
      }`}
    >
      {icon === "plus" ? <Plus size={14} strokeWidth={2.5} /> : <Minus size={14} strokeWidth={2.5} />}
    </button>
  );
}

function CompactLabel({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  return (
    <div className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-black bg-swiss-muted">
      {label}
      <span className="opacity-50 text-[10px]">{count}/{max}</span>
    </div>
  );
}

function AddToolbarButton({
  label,
  count,
  max,
  onClick,
}: {
  label: string;
  count: number;
  max: number;
  onClick: () => void;
}) {
  const disabled = count >= max;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`hidden lg:flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ease-out ${
        disabled
          ? "bg-swiss-muted opacity-40 cursor-not-allowed"
          : "bg-white hover:bg-black hover:text-white"
      }`}
    >
      <Plus size={14} strokeWidth={2.5} className={disabled ? "" : "transition-transform duration-200 group-hover:rotate-90"} />
      {label}
      <span className="opacity-50">{count}/{max}</span>
    </button>
  );
}

function RemoveToolbarButton({
  label,
  count,
  onClick,
}: {
  label: string;
  count: number;
  onClick: () => void;
}) {
  const disabled = count === 0;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`hidden lg:flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ease-out ${
        disabled
          ? "bg-swiss-muted opacity-40 cursor-not-allowed"
          : "bg-white hover:bg-swiss-accent hover:text-white"
      }`}
    >
      <Minus size={14} strokeWidth={2.5} />
      {label}
      <span className="opacity-50">{count}</span>
    </button>
  );
}

function drawDirectPaths(sim: ReturnType<typeof useStore.getState>["sim"], pos: Record<string, { x: number; y: number }>) {
  const qs = sim.queues.filter((q) => !q.isDlq);
  const q = qs[0];
  if (!q) return null;
  return (
    <>
      {sim.producers.map((p) => (
        <line key={p.id} x1={pos[p.id].x} y1={pos[p.id].y} x2={pos[q.id].x} y2={pos[q.id].y} stroke="#000000" strokeWidth={0.2} opacity={0.3} />
      ))}
      {sim.consumers.map((c) => (
        <line key={c.id} x1={pos[q.id].x} y1={pos[q.id].y} x2={pos[c.id].x} y2={pos[c.id].y} stroke="#000000" strokeWidth={0.2} opacity={0.3} />
      ))}
    </>
  );
}

function drawFanoutPaths(sim: ReturnType<typeof useStore.getState>["sim"], pos: Record<string, { x: number; y: number }>) {
  const ex = pos["exchange"];
  const realQueues = sim.queues.filter((q) => !q.isDlq);
  return (
    <>
      {sim.producers.map((p) => (
        <line key={p.id} x1={pos[p.id].x} y1={pos[p.id].y} x2={ex.x} y2={ex.y} stroke="#000000" strokeWidth={0.2} opacity={0.3} />
      ))}
      {realQueues.map((q) => (
        <line key={q.id} x1={ex.x} y1={ex.y} x2={pos[q.id].x} y2={pos[q.id].y} stroke="#000000" strokeWidth={0.2} opacity={0.3} />
      ))}
      {realQueues.map((q) => {
        const c = sim.consumers.find((c) => c.queueId === q.id);
        if (!c) return null;
        return (
          <line key={q.id + c.id} x1={pos[q.id].x} y1={pos[q.id].y} x2={pos[c.id].x} y2={pos[c.id].y} stroke="#000000" strokeWidth={0.2} opacity={0.3} />
        );
      })}
    </>
  );
}

function computePathLabels(
  sim: ReturnType<typeof useStore.getState>["sim"],
  pos: Record<string, Pos>
): PathLabel[] {
  const labels: PathLabel[] = [];
  const realQueues = sim.queues.filter((q) => !q.isDlq);

  if (sim.hasExchange) {
    const ex = pos["exchange"];
    sim.producers.forEach((p) => {
      labels.push({ from: pos[p.id], to: ex, text: "PUBLISH" });
    });
    realQueues.forEach((q) => {
      labels.push({
        from: ex,
        to: pos[q.id],
        text: sim.pattern === "pubsub" ? "FANOUT" : "ROUTE",
      });
    });
    realQueues.forEach((q) => {
      const c = sim.consumers.find((c) => c.queueId === q.id);
      if (c) labels.push({ from: pos[q.id], to: pos[c.id], text: "CONSUME" });
    });
  } else {
    const q = realQueues[0];
    if (!q) return labels;
    sim.producers.forEach((p) => {
      labels.push({ from: pos[p.id], to: pos[q.id], text: "PRODUCE" });
    });
    sim.consumers.forEach((c) => {
      labels.push({ from: pos[q.id], to: pos[c.id], text: "CONSUME" });
    });
  }

  return labels;
}
