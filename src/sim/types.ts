export type Pattern = "simple" | "work" | "pubsub" | "routing";

export type MessageState =
  | "to-queue" // producer → queue/exchange
  | "to-exchange" // producer → exchange (pubsub/routing)
  | "exchange-to-queue" // exchange → queue
  | "queued" // sitting in queue
  | "to-consumer" // queue → consumer
  | "processing" // consumer handling
  | "acked" // done, fading
  | "nacked" // returning to queue
  | "to-dlq" // heading to DLQ
  | "dlq"; // dead

export interface Producer {
  id: string;
  rate: number; // msgs/sec
  routingKey: string; // routing mode only
  color: string; // token hue
  blocked: boolean; // backpressure active
  emitAccum: number;
  totalEmitted: number;
  blockedTicks: number;
}

export interface Consumer {
  id: string;
  throughput: number; // msgs/sec
  ackPct: number; // 0-100
  paused: boolean;
  killed: boolean;
  queueId: string; // which queue this consumer drains
  inFlight: string[]; // message ids being processed
  procAccum: number;
  totalAcked: number;
  totalNacked: number;
}

export interface Queue {
  id: string;
  capacity: number;
  depth: string[]; // message ids (FIFO, index 0 = front)
  bindingKey: string; // routing mode: binding pattern (with wildcards)
  isDlq: boolean;
}

export interface Message {
  id: string;
  producerId: string;
  color: string;
  routingKey: string;
  deliveries: number;
  state: MessageState;
  atNode: string; // current logical node id
  fromNode: string; // animation origin
  toNode: string; // animation target
  bornTick: number;
  stateAge: number; // seconds in current state
}

export interface MetricSnapshot {
  tick: number;
  produced: number;
  acked: number;
  nacked: number;
  dlqd: number;
  queueDepths: Record<string, number>;
}

export interface SimState {
  pattern: Pattern;
  presetId: string;
  producers: Producer[];
  consumers: Consumer[];
  queues: Queue[];
  hasExchange: boolean;
  messages: Record<string, Message>;
  messageIds: string[]; // render order
  tick: number;
  running: boolean;
  speed: number; // global multiplier
  maxRedeliveries: number;
  msgCounter: number;
  // rolling metrics
  producedTotal: number;
  ackedTotal: number;
  nackedTotal: number;
  requeuedTotal: number;
  dlqdTotal: number;
  droppedTotal: number;
  flooded: boolean; // latches on once flooding starts, stays until reset
  everKilled: boolean; // latches on once any consumer is killed
  everNacked: boolean; // latches on once any nack occurs
  history: MetricSnapshot[]; // last N snapshots
  producerColors: string[];
  metricTimer: number; // accumulates for metric sampling
}

export const MAX_PRODUCERS = 8;
export const MAX_CONSUMERS = 8;
export const MAX_MESSAGES = 300;
export const HISTORY_LEN = 200; // ~10s at 20 ticks/s
