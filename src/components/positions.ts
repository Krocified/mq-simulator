import type { SimState } from "../sim/types";

export interface Pos {
  x: number; // %
  y: number; // %
}

const PRODUCER_X = 7;
const EXCHANGE_X = 28;
const QUEUE_X_SHARED = 42;
const QUEUE_X_FANOUT = 52;
const CONSUMER_X = 90;
const DLQ_X = 28;
const DLQ_Y = 90;

function spread(count: number, i: number): number {
  if (count <= 1) return 50;
  return 15 + (70 * i) / (count - 1);
}

export function computePositions(s: SimState): Record<string, Pos> {
  const pos: Record<string, Pos> = {};

  s.producers.forEach((p, i) => {
    pos[p.id] = { x: PRODUCER_X, y: spread(s.producers.length, i) };
  });

  if (s.hasExchange) {
    pos["exchange"] = { x: EXCHANGE_X, y: 50 };
  }

  const realQueues = s.queues.filter((q) => !q.isDlq);
  realQueues.forEach((q, i) => {
    if (s.hasExchange) {
      // align queue with its consumer
      const c = s.consumers.find((c) => c.queueId === q.id);
      const ci = c ? s.consumers.indexOf(c) : i;
      pos[q.id] = { x: QUEUE_X_FANOUT, y: spread(s.consumers.length, ci) };
    } else {
      pos[q.id] = { x: QUEUE_X_SHARED, y: 50 };
    }
  });

  s.consumers.forEach((c, i) => {
    pos[c.id] = { x: CONSUMER_X, y: spread(s.consumers.length, i) };
  });

  pos["dlq"] = { x: DLQ_X, y: DLQ_Y };

  return pos;
}

// Interpolate position for a traveling message, with a slight arc.
export function messagePos(
  from: Pos,
  to: Pos,
  t: number,
  arc = 12
): Pos {
  const x = from.x + (to.x - from.x) * t;
  const baseY = from.y + (to.y - from.y) * t;
  const y = baseY - Math.sin(t * Math.PI) * arc;
  return { x, y };
}
