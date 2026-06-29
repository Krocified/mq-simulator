import { useStore } from "../sim/store";
import { computePositions } from "./positions";
import { ProducerNode, ConsumerNode, QueueNode, ExchangeNode } from "./Nodes";
import { MessageLayer } from "./MessageLayer";
import { Plus } from "lucide-react";

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
  const pos = computePositions(sim);

  return (
    <div
      className="relative w-full flex-1 min-h-[480px] border-2 border-black bg-white swiss-grid-pattern overflow-hidden"
      onClick={() => onSelect(null)}
    >
      {/* connection paths */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {sim.hasExchange
          ? drawFanoutPaths(sim, pos)
          : drawDirectPaths(sim, pos)}
      </svg>

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

      {/* add buttons */}
      <AddButton
        x={7}
        y={sim.producers.length > 0 ? spreadY(sim.producers.length, sim.producers.length) : 50}
        onClick={(e) => {
          e.stopPropagation();
          addProducer();
        }}
        disabled={sim.producers.length >= 8}
        label="PRODUCER"
      />
      <AddButton
        x={90}
        y={sim.consumers.length > 0 ? spreadY(sim.consumers.length, sim.consumers.length) : 50}
        onClick={(e) => {
          e.stopPropagation();
          if (sim.pattern === "simple" && sim.consumers.length >= 1) return;
          addConsumer();
        }}
        disabled={
          sim.consumers.length >= 8 ||
          (sim.pattern === "simple" && sim.consumers.length >= 1)
        }
        label="CONSUMER"
      />
    </div>
  );
}

function spreadY(count: number, i: number): number {
  if (count <= 1) return 50;
  return 15 + (70 * i) / count;
}

function AddButton({
  x,
  y,
  onClick,
  disabled,
  label,
}: {
  x: number;
  y: number;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        title={`Add ${label}`}
        className={`w-10 h-10 flex items-center justify-center border-2 border-black bg-white transition-all duration-200 ease-out rounded-none ${
          disabled ? "opacity-20 cursor-not-allowed" : "hover:bg-black hover:text-white hover:rotate-90"
        }`}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </div>
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
