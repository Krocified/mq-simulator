import type { SimState } from "./types";
import type { PresetConfig } from "./presets";

// Encode current sim config (not live messages) to a compact URL param.
export function encodeState(s: SimState): string {
  const cfg: PresetConfig = {
    id: "custom",
    name: "Custom",
    pattern: s.pattern,
    queueCapacity: s.queues.find((q) => !q.isDlq)?.capacity ?? 100,
    maxRedeliveries: s.maxRedeliveries,
    producers: s.producers.map((p) => ({
      rate: p.rate,
      routingKey: s.pattern === "routing" ? p.routingKey : undefined,
    })),
    consumers: s.consumers.map((c) => ({
      throughput: c.throughput,
      ackPct: c.ackPct,
      bindingKey: s.pattern === "routing" ? s.queues.find((q) => q.id === c.queueId)?.bindingKey : undefined,
    })),
  };
  const json = JSON.stringify(cfg);
  return btoa(encodeURIComponent(json));
}

export function decodeState(token: string): PresetConfig | null {
  try {
    const json = decodeURIComponent(atob(token));
    return JSON.parse(json) as PresetConfig;
  } catch {
    return null;
  }
}

export function readUrlState(): string | null {
  const u = new URL(window.location.href);
  return u.searchParams.get("s");
}

export function writeUrlState(token: string) {
  const u = new URL(window.location.href);
  u.searchParams.set("s", token);
  window.history.replaceState({}, "", u.toString());
}
