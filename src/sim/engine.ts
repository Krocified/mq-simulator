import type { SimState, Message, Producer, Consumer, Queue } from "./types";
import { MAX_MESSAGES, HISTORY_LEN } from "./types";
import { topicMatch } from "./patterns";

const TRAVEL_TIME = 0.25; // seconds for a message to travel between nodes
const ACK_FADE_TIME = 0.5; // acked message lingers then GC'd
const METRIC_INTERVAL = 0.05; // seconds between metric snapshots

// ponytail: single shared queue for simple/work found by isDlq===false && bindingKey===""

export function tick(s: SimState, dt: number) {
  s.tick += dt;

  advanceMessages(s, dt);
  emitProducers(s, dt);
  processConsumers(s, dt);
  sampleMetrics(s, dt);
  gcMessages(s);
}

function advanceMessages(s: SimState, dt: number) {
  for (const id of s.messageIds) {
    const m = s.messages[id];
    if (!m) continue;
    m.stateAge += dt;
    switch (m.state) {
      case "to-queue":
        if (m.stateAge >= TRAVEL_TIME) arriveAtQueue(s, m);
        break;
      case "to-exchange":
        if (m.stateAge >= TRAVEL_TIME) fanoutFromExchange(s, m);
        break;
      case "exchange-to-queue":
        if (m.stateAge >= TRAVEL_TIME) arriveAtQueue(s, m);
        break;
      case "to-consumer":
        if (m.stateAge >= TRAVEL_TIME) {
          m.state = "processing";
          m.stateAge = 0;
        }
        break;
      case "nacked":
        if (m.stateAge >= TRAVEL_TIME) arriveAtQueue(s, m);
        break;
      case "to-dlq":
        if (m.stateAge >= TRAVEL_TIME) {
          m.state = "dlq";
          m.atNode = "dlq";
          m.stateAge = 0;
        }
        break;
      case "acked":
        // GC handles removal after fade
        break;
      default:
        break;
    }
  }
}

function arriveAtQueue(s: SimState, m: Message) {
  const q = s.queues.find((q) => q.id === m.toNode);
  if (!q || q.depth.length >= q.capacity) {
    // queue full or gone: drop (overflow loss)
    removeMessage(s, m.id);
    return;
  }
  q.depth.push(m.id);
  m.state = "queued";
  m.atNode = q.id;
  m.stateAge = 0;
}

function fanoutFromExchange(s: SimState, m: Message) {
  // exchange routes to matching queues; one copy per target
  const targets = s.queues.filter((q) => {
    if (q.isDlq) return false;
    if (s.pattern === "pubsub") return true;
    return topicMatch(q.bindingKey, m.routingKey);
  });
  removeMessage(s, m.id); // original consumed by exchange
  for (const q of targets) {
    if (q.depth.length >= q.capacity) continue; // overflow drop
    const copy = makeMessage(s, m.producerId, m.color, m.routingKey);
    copy.deliveries = m.deliveries;
    copy.state = "exchange-to-queue";
    copy.fromNode = "exchange";
    copy.toNode = q.id;
    copy.atNode = "exchange";
    copy.stateAge = 0;
    s.messages[copy.id] = copy;
    s.messageIds.push(copy.id);
  }
}

function emitProducers(s: SimState, dt: number) {
  for (const p of s.producers) {
    p.emitAccum += p.rate * dt;
    let emitted = false;
    while (p.emitAccum >= 1) {
      if (s.messageIds.length >= MAX_MESSAGES) {
        p.blocked = true;
        p.blockedTicks++;
        p.emitAccum = 0;
        break;
      }
      if (tryEmit(s, p)) {
        p.emitAccum -= 1;
        emitted = true;
      } else {
        p.blocked = true;
        p.blockedTicks++;
        p.emitAccum = 0;
        break;
      }
    }
    if (emitted) p.blocked = false;
  }
}

function tryEmit(s: SimState, p: Producer): boolean {
  if (s.hasExchange) {
    // pubsub/routing: check at least one target queue has space
    const targets = s.queues.filter((q) => {
      if (q.isDlq) return false;
      if (s.pattern === "pubsub") return true;
      return topicMatch(q.bindingKey, p.routingKey);
    });
    if (targets.length === 0) return false;
    if (targets.every((q) => q.depth.length >= q.capacity)) {
      p.blocked = true;
      return false;
    }
    const m = makeMessage(s, p.id, p.color, p.routingKey);
    m.state = "to-exchange";
    m.fromNode = p.id;
    m.toNode = "exchange";
    m.atNode = p.id;
    s.messages[m.id] = m;
    s.messageIds.push(m.id);
    p.totalEmitted++;
    s.producedTotal++;
    return true;
  }
  // simple/work: direct to shared queue
  const q = sharedQueue(s);
  if (!q || q.depth.length >= q.capacity) {
    p.blocked = true;
    return false;
  }
  const m = makeMessage(s, p.id, p.color, p.routingKey);
  m.state = "to-queue";
  m.fromNode = p.id;
  m.toNode = q.id;
  m.atNode = p.id;
  s.messages[m.id] = m;
  s.messageIds.push(m.id);
  p.totalEmitted++;
  s.producedTotal++;
  p.blocked = false;
  return true;
}

function processConsumers(s: SimState, dt: number) {
  for (const c of s.consumers) {
    if (c.killed) {
      for (const mid of c.inFlight) {
        const m = s.messages[mid];
        if (m) nackMessage(s, m, c);
      }
      c.inFlight = [];
      continue;
    }
    if (c.paused) continue;

    // pull one message from queue when idle
    if (c.inFlight.length < 1) {
      const q = s.queues.find((q) => q.id === c.queueId);
      if (q && q.depth.length > 0) {
        const mid = q.depth.shift()!;
        const m = s.messages[mid];
        if (m) {
          m.state = "to-consumer";
          m.fromNode = q.id;
          m.toNode = c.id;
          m.atNode = c.id;
          m.stateAge = 0;
          c.inFlight.push(mid);
        }
      }
    }

    // process in-flight
    if (c.inFlight.length > 0) {
      c.procAccum += c.throughput * dt;
      if (c.procAccum >= 1) {
        c.procAccum -= 1;
        const mid = c.inFlight.shift()!;
        const m = s.messages[mid];
        if (!m) continue;
        m.deliveries++;
        if (Math.random() * 100 < c.ackPct) {
          m.state = "acked";
          m.atNode = c.id;
          m.stateAge = 0;
          c.totalAcked++;
          s.ackedTotal++;
        } else {
          nackMessage(s, m, c);
        }
      }
    }
  }
}

function nackMessage(s: SimState, m: Message, c: Consumer) {
  c.totalNacked++;
  s.nackedTotal++;
  if (m.deliveries >= s.maxRedeliveries) {
    // dead letter
    m.state = "to-dlq";
    m.fromNode = c.id;
    m.toNode = "dlq";
    m.stateAge = 0;
    s.dlqdTotal++;
  } else {
    // requeue
    m.state = "nacked";
    m.fromNode = c.id;
    m.toNode = c.queueId;
    m.stateAge = 0;
    s.requeuedTotal++;
  }
}

function sharedQueue(s: SimState): Queue | undefined {
  return s.queues.find((q) => !q.isDlq);
}

function makeMessage(s: SimState, producerId: string, color: string, routingKey: string): Message {
  const id = `m${s.msgCounter++}`;
  return {
    id,
    producerId,
    color,
    routingKey,
    deliveries: 0,
    state: "queued",
    atNode: producerId,
    fromNode: producerId,
    toNode: "",
    bornTick: s.tick,
    stateAge: 0,
  };
}

function removeMessage(s: SimState, id: string) {
  delete s.messages[id];
  const i = s.messageIds.indexOf(id);
  if (i >= 0) s.messageIds.splice(i, 1);
}

function gcMessages(s: SimState) {
  // remove acked after fade
  for (let i = s.messageIds.length - 1; i >= 0; i--) {
    const id = s.messageIds[i];
    const m = s.messages[id];
    if (!m) {
      s.messageIds.splice(i, 1);
      continue;
    }
    if (m.state === "acked" && m.stateAge >= ACK_FADE_TIME) {
      delete s.messages[id];
      s.messageIds.splice(i, 1);
    }
  }
}

function sampleMetrics(s: SimState, dt: number) {
  s.metricTimer += dt;
  if (s.metricTimer < METRIC_INTERVAL) return;
  s.metricTimer = 0;
  const depths: Record<string, number> = {};
  for (const q of s.queues) depths[q.id] = q.depth.length;
  s.history.push({
    tick: s.tick,
    produced: s.producedTotal,
    acked: s.ackedTotal,
    nacked: s.nackedTotal,
    dlqd: s.dlqdTotal,
    queueDepths: depths,
  });
  if (s.history.length > HISTORY_LEN) s.history.shift();
}
