import type { SimState, Producer, Consumer, Queue } from "../sim/types";

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
        selected ? "z-20" : "z-10"
      } hover:z-40 ${className}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
      {color && (
        <div
          className="absolute -top-[2px] -left-[2px] w-3 h-3 bg-current"
          style={{ background: color }}
        />
      )}
      {tooltip && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200
                     whitespace-nowrap bg-black text-white border-2 border-black
                     px-3 py-2 z-30 rounded-none"
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
        <div className="flex flex-col gap-0.5 text-xs uppercase tracking-wider">
          <span className="font-black text-sm">PRODUCER P{p.id.slice(1)}</span>
          <span>RATE: {p.rate.toFixed(1)}/S</span>
          {p.routingKey && <span>KEY: {p.routingKey}</span>}
          <span>EMITTED: {p.totalEmitted}</span>
          {p.blocked && <span className="text-swiss-accent">BLOCKED</span>}
        </div>
      }
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-black rounded-none transition-colors duration-200 ease-out ${
          selected ? "bg-swiss-accent text-white" : "bg-white text-black hover:-translate-y-0.5"
        } ${p.blocked ? "border-swiss-accent" : ""}`}
      >
        <span className="font-black text-sm md:text-base uppercase tracking-tighter">P{p.id.slice(1)}</span>
        <span className="font-medium text-xs md:text-sm uppercase tracking-wider opacity-70">{p.rate.toFixed(1)}/S</span>
        {p.blocked && <span className="text-[10px] text-swiss-accent font-bold uppercase">BLK</span>}
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
  const dim = c.killed ? "opacity-30" : c.paused ? "opacity-50" : "";
  return (
    <NodeShell
      x={x}
      y={y}
      selected={selected}
      onClick={onClick}
      tooltip={
        <div className="flex flex-col gap-0.5 text-xs uppercase tracking-wider">
          <span className="font-black text-sm">CONSUMER C{c.id.slice(1)}</span>
          <span>THROUGHPUT: {c.throughput.toFixed(1)}/S</span>
          <span>ACK: {c.ackPct}%</span>
          <span>ACKED: {c.totalAcked} / NACKED: {c.totalNacked}</span>
          {c.inFlight.length > 0 && <span>IN-FLIGHT: {c.inFlight.length}</span>}
          {c.paused && <span className="text-swiss-accent">PAUSED</span>}
          {c.killed && <span className="text-swiss-accent">KILLED</span>}
        </div>
      }
    >
      <div
        className={`w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-black rounded-none transition-all duration-200 ease-out ${
          selected ? "bg-swiss-accent text-white" : "bg-white text-black hover:-translate-y-0.5"
        } ${dim}`}
      >
        <span className="font-black text-sm md:text-base uppercase tracking-tighter">C{c.id.slice(1)}</span>
        <span className="font-medium text-xs md:text-sm uppercase tracking-wider opacity-70">{c.throughput.toFixed(1)}/S</span>
        {c.paused && <span className="text-[10px] font-bold uppercase">PAUSE</span>}
        {c.killed && <span className="text-[10px] text-swiss-accent font-bold uppercase">DEAD</span>}
        {!c.paused && !c.killed && c.inFlight.length > 0 && (
          <span className="text-[10px] font-bold uppercase opacity-50">BUSY</span>
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
        <div className="flex flex-col gap-0.5 text-xs uppercase tracking-wider">
          <span className="font-black text-sm">QUEUE</span>
          <span>DEPTH: {q.depth.length} / {q.capacity}</span>
          <span>FILL: {Math.round(pct)}%</span>
          {pattern === "routing" && q.bindingKey && <span>BIND: {q.bindingKey}</span>}
          {full && <span className="text-swiss-accent">FULL, PRODUCERS BLOCKED</span>}
        </div>
      }
    >
      <div
        className={`w-28 md:w-32 border-2 border-black rounded-none transition-colors duration-200 ${
          full ? "border-swiss-accent" : ""
        } ${selected ? "bg-swiss-accent text-white" : "bg-white"}`}
      >
        <div className="px-3 py-2 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="font-black text-xs md:text-sm uppercase tracking-tighter">QUEUE</span>
            <span className="font-medium text-xs uppercase tracking-wider opacity-70">
              {q.depth.length}/{q.capacity}
            </span>
          </div>
          {pattern === "routing" && q.bindingKey && (
            <span className="font-medium text-[10px] uppercase tracking-wider text-swiss-accent truncate">
              {q.bindingKey}
            </span>
          )}
          <div className="h-1.5 bg-swiss-muted border border-black overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${full ? "bg-swiss-accent" : "bg-black"}`}
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
        <div className="flex flex-col gap-0.5 text-xs uppercase tracking-wider">
          <span className="font-black text-sm">DEAD LETTER QUEUE</span>
          <span>DEAD: {q.depth.length}</span>
          <span className="opacity-60">EXCEEDED MAX REDELIVERIES</span>
        </div>
      }
    >
      <div className="w-24 md:w-28 px-3 py-2 border-2 border-black border-dashed bg-swiss-muted rounded-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-swiss-accent" />
          <span className="font-black text-xs md:text-sm uppercase tracking-tighter">DLQ</span>
        </div>
        <span className="font-medium text-xs uppercase tracking-wider opacity-70">{q.depth.length} DEAD</span>
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
        <div className="flex flex-col gap-0.5 text-xs uppercase tracking-wider">
          <span className="font-black text-sm">EXCHANGE</span>
          <span>TYPE: {pattern === "pubsub" ? "FANOUT" : "TOPIC"}</span>
          <span className="opacity-60">
            {pattern === "pubsub" ? "COPIES EVERY MSG TO ALL QUEUES" : "ROUTES BY KEY → BINDING MATCH"}
          </span>
        </div>
      }
    >
      <div className="w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center bg-swiss-muted border-2 border-black rounded-none">
        <span className="font-black text-xs md:text-sm uppercase tracking-tighter">EXCH</span>
        <span className="font-medium text-[10px] md:text-xs uppercase tracking-wider opacity-70">
          {pattern === "pubsub" ? "FANOUT" : "TOPIC"}
        </span>
      </div>
    </NodeShell>
  );
}

export function MessageDots({ ids, max }: { ids: string[]; max: number }) {
  if (ids.length === 0) return <div className="h-3" />;
  const shown = ids.slice(-max);
  return (
    <div className="flex flex-wrap gap-0.5 mt-1">
      {shown.map((id, i) => (
        <div
          key={id}
          className="w-2 h-2 bg-black"
          style={{ opacity: 0.3 + (i / shown.length) * 0.7 }}
        />
      ))}
      {ids.length > max && (
        <span className="text-[9px] font-medium uppercase tracking-wider opacity-50">+{ids.length - max}</span>
      )}
    </div>
  );
}
