import { create } from "zustand";
import type { Pattern, SimState, Producer, Consumer } from "./types";
import { tick } from "./engine";
import { buildSimState, buildTopology, nextColor, type PresetConfig, PRESETS } from "./presets";
import { encodeState, decodeState, readUrlState, writeUrlState } from "./encode";

interface Store {
  sim: SimState;
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (n: number) => void;
  setPattern: (p: Pattern) => void;
  loadPreset: (cfg: PresetConfig) => void;
  addProducer: () => void;
  removeProducer: (id: string) => void;
  updateProducer: (id: string, patch: Partial<Producer>) => void;
  addConsumer: () => void;
  removeConsumer: (id: string) => void;
  updateConsumer: (id: string, patch: Partial<Consumer>) => void;
  updateQueueCapacity: (n: number) => void;
  setMaxRedeliveries: (n: number) => void;
  shareUrl: () => string;
}

const initial = loadInitial();

function loadInitial(): SimState {
  const token = readUrlState();
  if (token) {
    const cfg = decodeState(token);
    if (cfg) return buildSimState(cfg);
  }
  return buildSimState(PRESETS[0]);
}

let rafId: number | null = null;
let lastTime = 0;

function startLoop() {
  if (rafId !== null) return;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}
function stopLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
function loop(time: number) {
  const { sim } = useStore.getState();
  if (!sim.running) {
    stopLoop();
    return;
  }
  const dt = Math.min((time - lastTime) / 1000, 0.1) * sim.speed;
  lastTime = time;
  useStore.setState((prev) => {
    tick(prev.sim, dt);
    return { sim: { ...prev.sim } };
  });
  rafId = requestAnimationFrame(loop);
}

function queueCapacityOf(s: SimState): number {
  return s.queues.find((q) => !q.isDlq)?.capacity ?? 100;
}

export const useStore = create<Store>((set, get) => ({
  sim: initial,

  play: () => {
    set((prev) => ({ sim: { ...prev.sim, running: true } }));
    startLoop();
  },
  pause: () => {
    stopLoop();
    set((prev) => ({ sim: { ...prev.sim, running: false } }));
  },
  step: () => {
    set((prev) => {
      tick(prev.sim, 0.1 * prev.sim.speed);
      return { sim: { ...prev.sim } };
    });
  },
  reset: () => {
    set((prev) => {
      const sim = prev.sim;
      sim.messages = {};
      sim.messageIds = [];
      sim.tick = 0;
      sim.msgCounter = 0;
      sim.producedTotal = 0;
      sim.ackedTotal = 0;
      sim.nackedTotal = 0;
      sim.requeuedTotal = 0;
      sim.dlqdTotal = 0;
      sim.droppedTotal = 0;
      sim.flooded = false;
      sim.everKilled = false;
      sim.everNacked = false;
      sim.history = [];
      sim.metricTimer = 0;
      sim.queues.forEach((q) => (q.depth = []));
      sim.consumers.forEach((c) => {
        c.inFlight = [];
        c.procAccum = 0;
        c.totalAcked = 0;
        c.totalNacked = 0;
      });
      sim.producers.forEach((p) => {
        p.emitAccum = 0;
        p.totalEmitted = 0;
        p.blockedTicks = 0;
        p.blocked = false;
      });
      return { sim: { ...sim } };
    });
  },
  setSpeed: (n) =>
    set((prev) => ({ sim: { ...prev.sim, speed: n } })),
  setPattern: (p) => {
    const cfg: PresetConfig = {
      id: "custom",
      name: "Custom",
      pattern: p,
      queueCapacity: queueCapacityOf(get().sim),
      maxRedeliveries: get().sim.maxRedeliveries,
      producers: get().sim.producers.map((pr) => ({
        rate: pr.rate,
        routingKey: p === "routing" ? pr.routingKey || "logs.#" : undefined,
      })),
      consumers: get().sim.consumers.map((c) => {
        const q = get().sim.queues.find((q) => q.id === c.queueId);
        return {
          throughput: c.throughput,
          ackPct: c.ackPct,
          bindingKey: p === "routing" ? q?.bindingKey || "logs.#" : undefined,
        };
      }),
    };
    // simple pattern caps consumers at 1
    if (p === "simple" && cfg.consumers.length > 1) {
      cfg.consumers = cfg.consumers.slice(0, 1);
    }
    set({ sim: buildSimState(cfg) });
  },
  loadPreset: (cfg) => set({ sim: buildSimState(cfg) }),
  addProducer: () =>
    set((prev) => {
      if (prev.sim.producers.length >= 8) return prev;
      const sim = prev.sim;
      const p: Producer = {
        id: `p${sim.producers.length}`,
        rate: 1,
        routingKey: sim.pattern === "routing" ? "logs.#" : "",
        color: nextColor(sim),
        blocked: false,
        emitAccum: 0,
        totalEmitted: 0,
        blockedTicks: 0,
      };
      return { sim: { ...sim, producers: [...sim.producers, p] } };
    }),
  removeProducer: (id) =>
    set((prev) => {
      const next = { ...prev.sim, producers: prev.sim.producers.filter((p) => p.id !== id) };
      const bindingKeys = next.consumers.map((_, i) => {
        const oldQ = prev.sim.queues.find((q) => q.id === `q-c${i}`);
        return oldQ?.bindingKey ?? (next.pattern === "routing" ? "logs.#" : "");
      });
      buildTopology(next, queueCapacityOf(prev.sim), bindingKeys);
      return { sim: next };
    }),
  updateProducer: (id, patch) =>
    set((prev) => ({
      sim: {
        ...prev.sim,
        producers: prev.sim.producers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      },
    })),
  addConsumer: () =>
    set((prev) => {
      const sim = prev.sim;
      const max = sim.pattern === "simple" ? 1 : 8;
      if (sim.consumers.length >= max) return prev;
      const id = `c${sim.consumers.length}`;
      const c: Consumer = {
        id,
        throughput: 1,
        ackPct: 100,
        paused: false,
        killed: false,
        queueId: "",
        inFlight: [],
        procAccum: 0,
        totalAcked: 0,
        totalNacked: 0,
      };
      const next = { ...sim, consumers: [...sim.consumers, c] };
      const bindingKeys = sim.queues.filter((q) => !q.isDlq).map((q) => q.bindingKey);
      const newBindings = sim.pattern === "routing" ? [...bindingKeys, "logs.#"] : undefined;
      buildTopology(next, queueCapacityOf(sim), newBindings);
      return { sim: next };
    }),
  removeConsumer: (id) =>
    set((prev) => {
      const next = { ...prev.sim, consumers: prev.sim.consumers.filter((c) => c.id !== id) };
      const bindingKeys = next.consumers.map((_, i) => {
        const oldQ = prev.sim.queues.find((q) => q.id === `q-c${i}`);
        return oldQ?.bindingKey ?? (next.pattern === "routing" ? "logs.#" : "");
      });
      buildTopology(next, queueCapacityOf(prev.sim), bindingKeys);
      return { sim: next };
    }),
  updateConsumer: (id, patch) =>
    set((prev) => ({
      sim: {
        ...prev.sim,
        consumers: prev.sim.consumers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      },
    })),
  updateQueueCapacity: (n) =>
    set((prev) => {
      const sim = prev.sim;
      sim.queues.forEach((q) => {
        if (!q.isDlq) q.capacity = n;
      });
      return { sim: { ...sim } };
    }),
  setMaxRedeliveries: (n) =>
    set((prev) => ({ sim: { ...prev.sim, maxRedeliveries: n } })),
  shareUrl: () => {
    const token = encodeState(get().sim);
    writeUrlState(token);
    return window.location.href;
  },
}));
