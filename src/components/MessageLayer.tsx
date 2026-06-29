import type { SimState, Message } from "../sim/types";
import type { Pos } from "./positions";
import { messagePos } from "./positions";
import { WOBBLY_SM } from "../ui/wobbly";

const TRAVEL_TIME = 0.25;
const ACK_FADE = 0.5;

const TRAVELING = new Set([
  "to-queue",
  "to-exchange",
  "exchange-to-queue",
  "to-consumer",
  "nacked",
  "to-dlq",
]);

export function MessageLayer({
  sim,
  pos,
}: {
  sim: SimState;
  pos: Record<string, Pos>;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {sim.messageIds.map((id) => {
        const m = sim.messages[id];
        if (!m) return null;
        const p = messagePixelPos(m, sim, pos);
        if (!p) return null;
        return <Token key={id} m={m} x={p.x} y={p.y} />;
      })}
    </div>
  );
}

function messagePixelPos(
  m: Message,
  sim: SimState,
  pos: Record<string, Pos>
): Pos | null {
  // traveling: interpolate from → to
  if (TRAVELING.has(m.state)) {
    const from = pos[m.fromNode];
    const to = pos[m.toNode];
    if (!from || !to) return pos[m.atNode] ?? null;
    const t = Math.min(m.stateAge / TRAVEL_TIME, 1);
    return messagePos(from, to, t);
  }

  // queued: stack at queue position
  if (m.state === "queued") {
    const q = sim.queues.find((q) => q.id === m.atNode);
    const base = pos[m.atNode];
    if (!base || !q) return null;
    const idx = q.depth.indexOf(m.id);
    const offsetY = Math.min(idx, 15) * 1.5;
    const offsetX = Math.floor(Math.min(idx, 15) / 5) * 3;
    return { x: base.x + offsetX - 3, y: base.y + offsetY - 2 };
  }

  // dlq: stack at dlq position
  if (m.state === "dlq") {
    const base = pos["dlq"];
    if (!base) return null;
    const idx = sim.queues.find((q) => q.id === "dlq")?.depth.indexOf(m.id) ?? 0;
    const offsetY = Math.min(idx, 10) * 1.2;
    return { x: base.x, y: base.y + offsetY - 2 };
  }

  // processing / acked: at consumer
  if (m.state === "processing" || m.state === "acked") {
    return pos[m.atNode] ?? null;
  }

  return pos[m.atNode] ?? null;
}

function Token({ m, x, y }: { m: Message; x: number; y: number }) {
  const opacity =
    m.state === "acked"
      ? Math.max(0, 1 - m.stateAge / ACK_FADE)
      : m.state === "nacked" || m.state === "to-dlq"
      ? 0.8
      : 1;

  const ring =
    m.state === "nacked"
      ? "border-accent"
      : m.state === "to-dlq"
      ? "border-ink/60 border-dashed"
      : "border-ink/50";

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%`, opacity, transition: "opacity 100ms" }}
    >
      <div
        className={`w-3 h-3 md:w-3.5 md:h-3.5 border ${ring}`}
        style={{
          borderRadius: WOBBLY_SM,
          background: m.color,
        }}
      />
      {m.state === "acked" && (
        <span
          className="absolute -top-2 -right-2 text-[10px] text-ballpoint font-heading"
          style={{ opacity }}
        >
          ✓
        </span>
      )}
    </div>
  );
}
