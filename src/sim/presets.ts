import type { Pattern, SimState } from "./types";
import { MAX_PRODUCERS, MAX_CONSUMERS } from "./types";

export interface PresetConfig {
  id: string;
  name: string;
  pattern: Pattern;
  queueCapacity: number;
  maxRedeliveries: number;
  producers: { rate: number; routingKey?: string }[];
  consumers: {
    throughput: number;
    ackPct: number;
    bindingKey?: string;
    paused?: boolean;
    killed?: boolean;
  }[];
}

export const PRESETS: PresetConfig[] = [
  {
    id: "happy",
    name: "Happy path",
    pattern: "simple",
    queueCapacity: 100,
    maxRedeliveries: 3,
    producers: [{ rate: 2 }],
    consumers: [{ throughput: 2, ackPct: 100 }],
  },
  {
    id: "competing",
    name: "Competing consumers",
    pattern: "work",
    queueCapacity: 100,
    maxRedeliveries: 3,
    producers: [{ rate: 4 }],
    consumers: [
      { throughput: 1.5, ackPct: 100 },
      { throughput: 1.5, ackPct: 100 },
      { throughput: 1.5, ackPct: 100 },
    ],
  },
  {
    id: "broadcast",
    name: "Broadcast",
    pattern: "pubsub",
    queueCapacity: 50,
    maxRedeliveries: 3,
    producers: [{ rate: 2 }],
    consumers: [
      { throughput: 2, ackPct: 100 },
      { throughput: 1, ackPct: 100 },
      { throughput: 3, ackPct: 100 },
    ],
  },
  {
    id: "routing",
    name: "Selective routing",
    pattern: "routing",
    queueCapacity: 50,
    maxRedeliveries: 3,
    producers: [
      { rate: 1.5, routingKey: "logs.error.app1" },
      { rate: 1.5, routingKey: "logs.info.app2" },
    ],
    consumers: [
      { throughput: 2, ackPct: 100, bindingKey: "logs.error.*" },
      { throughput: 2, ackPct: 100, bindingKey: "logs.info.*" },
      { throughput: 2, ackPct: 100, bindingKey: "logs.#" },
    ],
  },
  {
    id: "backpressure",
    name: "Backpressure",
    pattern: "work",
    queueCapacity: 15,
    maxRedeliveries: 3,
    producers: [{ rate: 5 }],
    consumers: [
      { throughput: 1, ackPct: 100 },
      { throughput: 1, ackPct: 100 },
    ],
  },
  {
    id: "poison",
    name: "Poison messages",
    pattern: "work",
    queueCapacity: 80,
    maxRedeliveries: 3,
    producers: [{ rate: 3 }],
    consumers: [{ throughput: 2, ackPct: 40 }],
  },
  {
    id: "slow",
    name: "Slow consumer",
    pattern: "work",
    queueCapacity: 100,
    maxRedeliveries: 3,
    producers: [{ rate: 3 }],
    consumers: [
      { throughput: 0.5, ackPct: 100, paused: false },
      { throughput: 2, ackPct: 100 },
      { throughput: 2, ackPct: 100 },
    ],
  },
];

const PRODUCER_COLORS = [
  "#ff4d4d",
  "#2d5da1",
  "#e08e0b",
  "#3a8a3a",
  "#8e44ad",
  "#c0392b",
  "#16a085",
  "#d35400",
];

export function buildSimState(cfg: PresetConfig): SimState {
  const producers = cfg.producers.map((p, i) => ({
    id: `p${i}`,
    rate: p.rate,
    routingKey: p.routingKey ?? "",
    color: PRODUCER_COLORS[i % PRODUCER_COLORS.length],
    blocked: false,
    emitAccum: 0,
    totalEmitted: 0,
    blockedTicks: 0,
  }));

  const hasExchange = cfg.pattern === "pubsub" || cfg.pattern === "routing";

  const consumers = cfg.consumers.map((c, i) => ({
    id: `c${i}`,
    throughput: c.throughput,
    ackPct: c.ackPct,
    paused: c.paused ?? false,
    killed: c.killed ?? false,
    queueId: "",
    inFlight: [],
    procAccum: 0,
    totalAcked: 0,
    totalNacked: 0,
  }));

  const state: SimState = {
    pattern: cfg.pattern,
    producers,
    consumers,
    queues: [],
    hasExchange,
    messages: {},
    messageIds: [],
    tick: 0,
    running: false,
    speed: 1,
    maxRedeliveries: cfg.maxRedeliveries,
    msgCounter: 0,
    producedTotal: 0,
    ackedTotal: 0,
    nackedTotal: 0,
    requeuedTotal: 0,
    dlqdTotal: 0,
    history: [],
    producerColors: PRODUCER_COLORS,
    metricTimer: 0,
  };
  buildTopology(state, cfg.queueCapacity, cfg.consumers.map((c) => c.bindingKey ?? ""));
  return state;
}

// Rebuild queues based on pattern + consumers. Clears messages.
export function buildTopology(
  state: SimState,
  queueCapacity: number,
  bindingKeys?: string[]
) {
  state.messages = {};
  state.messageIds = [];
  state.queues = [];
  state.consumers.forEach((c) => {
    c.inFlight = [];
    c.procAccum = 0;
  });

  const dlq = {
    id: "dlq",
    capacity: 9999,
    depth: [],
    bindingKey: "",
    isDlq: true,
  };

  if (state.hasExchange) {
    // one queue per consumer
    state.consumers.forEach((c, i) => {
      const qid = `q-${c.id}`;
      state.queues.push({
        id: qid,
        capacity: queueCapacity,
        depth: [],
        bindingKey: bindingKeys?.[i] ?? (state.pattern === "routing" ? "#" : ""),
        isDlq: false,
      });
      c.queueId = qid;
    });
  } else {
    // shared queue
    state.queues.push({
      id: "q0",
      capacity: queueCapacity,
      depth: [],
      bindingKey: "",
      isDlq: false,
    });
    state.consumers.forEach((c) => (c.queueId = "q0"));
  }
  state.queues.push(dlq);
}

export function nextColor(state: SimState): string {
  return PRODUCER_COLORS[state.producers.length % PRODUCER_COLORS.length];
}

export { PRODUCER_COLORS, MAX_PRODUCERS, MAX_CONSUMERS };
