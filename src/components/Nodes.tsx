import type { SimState, Producer, Consumer, Queue } from "../sim/types";
import { WOBBLY_SM, WOBBLY_MD } from "../ui/wobbly";

const TRAVEL_TIME = 0.25;

export function NodeShell({
  x,
  y,
  children,
  className = "",
  selected,
  onClick,
  color,
  tooltip,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  color?: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 ${onClick ? "cursor-pointer" : ""} ${
        selected ? "ring-2 ring-ballpoint/40 z-20" : "z-10"
      } ${className}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
      {color && (
        <div
          className="absolute -top-1 -left-1 w-3 h-3 border border-ink"
          style={{ borderRadius: WOBBLY_SM, background: color }}
        />
      )}
      {tooltip && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full
                     opacity-0 group-hover:opacity-100 transition-opacity duration-100
                     whitespace-nowrap bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#2d2d2d]
                     px-3 py-1.5 z-30"
          style={{ borderRadius: WOBBLY_SM }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

export function ProducerNode({
  p,
  x,
  y,
  selected,
  onClick,
}: {
  p: Producer;
  x: number;
  y: number;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <NodeShell
      x={x}
      y={y}
      selected={selected}
      onClick={onClick}
      color={p.color}
      tooltip={
        <div className="flex flex-col gap-0.5 font-body text-xs">
          <span className="font-heading font-bold text-sm">Producer P{p.id.slice(1)}</span>
          <span>Rate: <span className="text-ballpoint">{p.rate.toFixed(1)}/s</span></span>
          {p.routingKey && <span>Key: <span className="text-ballpoint">{p.routingKey}</span></span>}
          <span>Emitted: {p.totalEmitted}</span>
          {p.blocked && <span className="text-accent">Blocked (queue full)</span>}
        </div>
      }
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 hover:-rotate-2 ${
          p.blocked ? "animate-pulse" : ""
        }`}
        style={{
          borderRadius: WOBBLY_MD,
          borderColor: p.blocked ? "#ff4d4d" : undefined,
        }}
      >
        <span className="font-heading font-bold text-sm md:text-base">P{p.id.slice(1)}</span>
        <span className="font-body text-xs md:text-sm text-ink/70">{p.rate.toFixed(1)}/s</span>
        {p.blocked && <span className="text-[10px] text-accent font-body">blocked</span>}
      </div>
    </NodeShell>
  );
}

export function ConsumerNode({
  c,
  x,
  y,
  selected,
  onClick,
}: {
  c: Consumer;
  x: number;
  y: number;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const dim = c.killed ? "opacity-40 grayscale" : c.paused ? "opacity-60" : "";
  return (
    <NodeShell
      x={x}
      y={y}
      selected={selected}
      onClick={onClick}
      tooltip={
        <div className="flex flex-col gap-0.5 font-body text-xs">
          <span className="font-heading font-bold text-sm">Consumer C{c.id.slice(1)}</span>
          <span>Throughput: <span className="text-ballpoint">{c.throughput.toFixed(1)}/s</span></span>
          <span>Ack: <span className="text-ballpoint">{c.ackPct}%</span></span>
          <span>Acked: {c.totalAcked} · Nacked: {c.totalNacked}</span>
          {c.inFlight.length > 0 && <span>In-flight: {c.inFlight.length}</span>}
          {c.paused && <span className="text-ballpoint">Paused</span>}
          {c.killed && <span className="text-accent">Killed — in-flight nacked</span>}
        </div>
      }
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center bg-white border-[3px] border-ink shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 hover:rotate-1 ${dim}`}
        style={{ borderRadius: WOBBLY_MD }}
      >
        <span className="font-heading font-bold text-sm md:text-base">
          C{c.id.slice(1)}
        </span>
        <span className="font-body text-xs md:text-sm text-ink/70">
          {c.throughput.toFixed(1)}/s
        </span>
        {c.paused && <span className="text-[10px] text-ballpoint font-body">paused</span>}
        {c.killed && <span className="text-[10px] text-accent font-body">dead</span>}
        {!c.paused && !c.killed && c.inFlight.length > 0 && (
          <span className="text-[10px] text-ink/50 font-body">busy</span>
        )}
      </div>
    </NodeShell>
  );
}

export function QueueNode({
  q,
  x,
  y,
  pattern,
  selected,
  onClick,
}: {
  q: Queue;
  x: number;
  y: number;
  pattern: SimState["pattern"];
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  if (q.isDlq) return <DLQNode q={q} x={x} y={y} />;
  const pct = q.capacity > 0 ? (q.depth.length / q.capacity) * 100 : 0;
  const full = q.depth.length >= q.capacity;
  return (
    <NodeShell
      x={x}
      y={y}
      selected={selected}
      onClick={onClick}
      tooltip={
        <div className="flex flex-col gap-0.5 font-body text-xs">
          <span className="font-heading font-bold text-sm">Queue</span>
          <span>Depth: <span className="text-ballpoint">{q.depth.length}</span> / {q.capacity}</span>
          <span>Fill: {Math.round(pct)}%</span>
          {pattern === "routing" && q.bindingKey && (
            <span>Bind: <span className="text-ballpoint">{q.bindingKey}</span></span>
          )}
          {full && <span className="text-accent">Full — producers blocked</span>}
        </div>
      }
    >
      <div
        className={`w-28 md:w-32 border-[3px] border-ink shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 ${
          full ? "border-accent animate-pulse" : ""
        }`}
        style={{
          borderRadius: WOBBLY_MD,
          background: full ? "#fff0f0" : "#ffffff",
        }}
      >
        <div className="px-3 py-2 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="font-heading font-bold text-xs md:text-sm">Queue</span>
            <span className="font-body text-xs text-ink/60">
              {q.depth.length}/{q.capacity}
            </span>
          </div>
          {pattern === "routing" && q.bindingKey && (
            <span className="font-body text-[10px] text-ballpoint truncate">
              bind: {q.bindingKey}
            </span>
          )}
          <div className="h-2 bg-muted rounded-full overflow-hidden border border-ink/20">
            <div
              className={`h-full transition-all ${full ? "bg-accent" : "bg-ballpoint"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <MessageDots ids={q.depth} max={20} />
        </div>
      </div>
    </NodeShell>
  );
}

export function DLQNode({ q, x, y }: { q: Queue; x: number; y: number }) {
  return (
    <NodeShell
      x={x}
      y={y}
      tooltip={
        <div className="flex flex-col gap-0.5 font-body text-xs">
          <span className="font-heading font-bold text-sm">Dead Letter Queue</span>
          <span>Dead messages: <span className="text-accent">{q.depth.length}</span></span>
          <span className="text-ink/60">Exceeded max redeliveries</span>
        </div>
      }
    >
      <div
        className="w-24 md:w-28 px-3 py-2 border-2 border-dashed border-ink bg-muted/50 shadow-[3px_3px_0px_0px_rgba(45,45,45,0.2)]"
        style={{ borderRadius: WOBBLY_MD }}
      >
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-accent border border-ink shadow-[1px_1px_0px_0px_#2d2d2d]" />
          <span className="font-heading font-bold text-xs md:text-sm">DLQ</span>
        </div>
        <span className="font-body text-xs text-ink/60">{q.depth.length} dead</span>
        <MessageDots ids={q.depth} max={15} />
      </div>
    </NodeShell>
  );
}

export function ExchangeNode({
  pattern,
  x,
  y,
}: {
  pattern: SimState["pattern"];
  x: number;
  y: number;
}) {
  return (
    <NodeShell
      x={x}
      y={y}
      tooltip={
        <div className="flex flex-col gap-0.5 font-body text-xs">
          <span className="font-heading font-bold text-sm">Exchange</span>
          <span>Type: <span className="text-ballpoint">{pattern === "pubsub" ? "fanout" : "topic"}</span></span>
          <span className="text-ink/60">
            {pattern === "pubsub"
              ? "Copies every msg to all queues"
              : "Routes by routing key → binding match"}
          </span>
        </div>
      }
    >
      <div
        className="w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center bg-postit border-[3px] border-ink shadow-[4px_4px_0px_0px_#2d2d2d]"
        style={{ borderRadius: WOBBLY_MD, transform: "rotate(-1deg)" }}
      >
        <span className="font-heading font-bold text-xs md:text-sm">Exchange</span>
        <span className="font-body text-[10px] md:text-xs text-ink/60">
          {pattern === "pubsub" ? "fanout" : "topic"}
        </span>
      </div>
    </NodeShell>
  );
}

// Small colored dots representing messages stacked in a queue/dlq/consumer.
export function MessageDots({ ids, max }: { ids: string[]; max: number }) {
  if (ids.length === 0) return <div className="h-3" />;
  const shown = ids.slice(-max);
  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {shown.map((id, i) => (
        <div
          key={id}
          className="w-2 h-2 border border-ink/40"
          style={{
            borderRadius: "60% 40% 50% 50% / 40% 60% 40% 60%",
            opacity: 0.4 + (i / shown.length) * 0.6,
          }}
        />
      ))}
      {ids.length > max && (
        <span className="text-[9px] text-ink/50 font-body">+{ids.length - max}</span>
      )}
    </div>
  );
}

export { TRAVEL_TIME };
