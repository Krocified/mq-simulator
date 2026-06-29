# PRD — Message Queue Simulator

**Status:** Draft v1 · **Owner:** maxjoong · **Date:** 2026-06-29

## 1. Overview

An in-browser, single-page simulator that *shows* how message queues behave. Users place producers and consumers on a canvas, pick a delivery pattern, tune rates and capacity, then watch messages animate from producer → queue → consumer. The goal is to make abstract MQ concepts (FIFO, competing consumers, fanout, routing, ack/nack, backpressure, DLQ) feel obvious through motion.

**One-sentence pitch:** "See the queue breathe." A live, animated playground where every message is a visible token and every queue mechanic is a visible behavior.

## 2. Target users

- **Learners** reading about MQ/RabbitMQ/Kafka who want to *see* the patterns instead of parsing ASCII diagrams.
- **Educators** who want a shareable URL demoing a concept live during a lesson or stream.
- **Curious devs** validating mental models before building real systems.

Not a load-testing tool. Not a real broker. Numbers are illustrative, not benchmarks.

## 3. Goals & non-goals

**Goals**
- Make queue mechanics legible through animation, not text.
- Support the four canonical patterns as selectable modes.
- Let users inject failure scenarios and watch the system respond.
- Provide live, honest metrics that explain *why* the queue behaves as it does.
- Run entirely client-side — no backend, no accounts, instant share-by-URL.

**Non-goals (v1)**
- Realistic network latency / cross-region simulation.
- Persistence across reloads (state lives in URL params only).
- Multi-broker clustering or replication.
- Real protocol fidelity (AMQP/Kafka wire behavior). We model the *semantics*, not the wire.

## 4. Patterns (selectable)

A top-level selector switches the whole canvas topology. Switching resets the sim with a confirm prompt if a run is in progress.

| Mode | Topology | Delivery rule |
|------|----------|---------------|
| **Simple queue** | N producers → 1 queue → 1 consumer | FIFO, single drain |
| **Work queue** | N producers → 1 queue → M consumers | Competing consumers; one msg → one consumer |
| **Pub/sub (fanout)** | N producers → 1 exchange → M queues (one per consumer) | Each msg → every consumer |
| **Routing/topic** | N producers → 1 exchange → M bound queues (by routing key) | Msg delivered only to queues matching key |

Routing mode exposes a per-producer routing-key field and per-consumer binding-key field. Matching supports AMQP-style wildcards: `*` matches exactly one word, `#` matches zero or more words, keys delimited by `.`. Example: binding `logs.*.app1` catches `logs.error.app1`; binding `logs.#` catches `logs.error.app1.db`.

## 5. Core features

### 5.1 Canvas & entities
- **Producers** — left column. Add/remove, each with configurable rate (msgs/sec, 0.1–10, step 0.1) and (in routing mode) routing key.
- **Consumers** — right column. Add/remove, each with configurable throughput (msgs/sec, 0.1–10), an "ack/nack probability" slider, and a pause/kill toggle.
- **Queue(s)** — center. One in simple/work modes; one-per-consumer in pub/sub; binding-filtered set in routing. Each queue shows live depth vs. capacity.
- **Exchange** — visible node only in pub/sub and routing modes.
- **Messages** — animated tokens. Color-coded by producer origin. Travel along curved paths from producer → queue → consumer.

### 5.2 Controls
- **Play / Pause / Step** — step advances one tick (one message emission per active producer).
- **Speed** — global time multiplier (0.25×–4×).
- **Reset** — clears all messages and metrics, keeps topology.
- **Pattern selector** — switches topology (see §4).
- **Failure injection** — per-consumer: pause, kill (crashes; messages in-flight nacked), set ack%. Global: "poison queue" toggle (next N messages auto-nack).

### 5.3 Failure scenarios
- **Ack/Nack** — each consumer has an ack probability. Nacked messages requeue (re-deliver) up to a `maxRedeliveries` count (default 3).
- **Dead letter queue** — messages exceeding `maxRedeliveries` route to a DLQ node shown below the main queue. DLQ depth is a metric.
- **Backpressure** — when a queue hits capacity, producers visually "block" (token hovers at queue mouth, producer pulses red, emission pauses until space frees). Configurable capacity per queue (10–500).
- **Slow/failed consumers** — pause freezes a consumer (in-flight messages requeue after timeout). Kill simulates a crash: in-flight messages nacked, consumer node greys out.

### 5.4 Live metrics
Persistent side/bottom panel, updates every tick:
- **Throughput** — total msgs/sec in, msgs/sec out (line sparkline, rolling 10s window).
- **Queue depth** — current / capacity, per queue.
- **Ack / Nack / Requeue / DLQ counts** — cumulative + rate.
- **Consumer lag** — per consumer: msgs assigned but not yet acked.
- **Producer blocked time** — % of last 10s each producer spent blocked on full queue.

## 6. Constraints (max)

To keep the canvas readable and perf in check:

| Entity | Min | Max | Notes |
|--------|-----|-----|-------|
| Producers | 1 | 8 | |
| Consumers | 1 | 8 | |
| Queues | 1 | 8 (pub/sub) | Auto-managed by pattern |
| Queue capacity | 10 | 500 | |
| Messages on canvas | — | 300 hard cap | Older tokens GC'd past queue depth view |
| Redelivery cap | 1 | 10 | |

Maxes enforced in UI (disable "Add" at cap). Hard message cap protects frame budget.

## 7. Animation & visualization

- **Pathing**: bezier curves producer→queue, queue→consumer. In pub/sub/routing, exchange is a fork point with fanout curves.
- **Message tokens**: small wobbly cards (per design system — see AGENTS.md). Color hue = producer id; small id label on hover.
- **States visualized**:
  - In-flight (traveling) — token animates along path.
  - Queued — token stacks visibly in the queue column, newest at top.
  - Processing — token sits on consumer, consumer node pulses.
  - Acked — token fades + check-mark flourish.
  - Nacked → requeue — token travels back to queue, dashed red outline.
  - DLQ — token drops to DLQ node, greyed.
  - Backpressure — producer node pulses red; token "knocks" at full queue mouth.
- **Easing**: snappy `transition-transform duration-100` per design system. Message travel uses a slightly longer ease (~250ms) so motion is legible, not instant.
- **Reduced motion**: respects `prefers-reduced-motion` — tokens teleport, states shown via outline/color only.

## 8. UI/UX

Follows the **Swiss International design system** in AGENTS.md. Specifically:

- Canvas = large wobbly card with paper-dot background. Producers/consumers/queues = wobbly nodes with hard offset shadows.
- Control bar = sticky bottom or left rail, wobbly buttons (play/pause/step/reset per design system button spec).
- Pattern selector = segmented wobbly pills.
- Per-node config = wobbly popover on click (rate sliders, ack%, kill/pause).
- Metrics panel = right rail (desktop) / collapsible drawer (mobile), wobbly cards per metric, hand-drawn sparklines.
- Typography: Kalam for labels/metrics numbers, Patrick Hand for body/help text.
- Decorations: dashed lines for message paths, tape strips on the metrics panel header, thumbtack on the "DLQ" node.
- Responsive: canvas stacks vertically on mobile; metrics drawer collapses; per-node config becomes bottom-sheet.

## 9. Shareability

- **URL state encoding**: full topology + params encoded in URL query string (compressed base64). Paste the URL → identical sim loads. No backend required.
- **Copy-link button** in the control bar.
- No accounts, no save. URL *is* the save.

## 10. Tech stack (proposed)

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | React + Vite | Fast HMR, simple SPA, matches design-system's `style={{}}` idiom |
| Styling | Tailwind CSS | Design system is Tailwind-native |
| Animation | Framer Motion | Path animation + per-token lifecycle; declarative |
| State | Zustand or React context + reducer | Sim tick state; avoid redux ceremony |
| Sim loop | `requestAnimationFrame` with fixed-step accumulator | Deterministic, pause-friendly |
| Icons | lucide-react | Per design system |
| Fonts | Kalam + Patrick Hand via Google Fonts | Per design system |
| Routing | none (single page) | YAGNI |

The sim is a **fixed-timestep loop** decoupled from render: tick produces/consumes, then render reads state. Speed multiplier scales tick rate, not render rate. Step = run exactly one tick.

## 11. Data model (sketch)

```
Producer  { id, rate, routingKey?, blocked, color }
Consumer  { id, throughput, ackPct, paused, killed, inFlight[] }
Queue     { id, capacity, depth[], bindings? (routing mode), dlq: Queue }
Exchange  { id, type: 'fanout'|'topic' }   // pub/sub + routing only
Message   { id, producerId, routingKey?, deliveries, state, queuedAt }
```

Messages are immutable; state transitions append to a small event log powering both animation and metrics.

## 12. Out of scope (v1)

- Multiple exchanges.
- Clustering / replication / HA.
- Persistence beyond URL.
- Auth, multi-user, collaborative editing.
- Real broker adapters (no AMQP/Kafka client).
- Export to video/GIF (consider v2).

## 13. Preset scenarios

A gallery of one-click preset buttons alongside the pattern selector. Each preset loads a preconfigured topology + params that demonstrate a concept. **Loaded presets are fully adjustable** — the user can tweak any rate, capacity, ack%, add/remove nodes after loading. A preset is just a starting point, not a lock.

| Preset | Pattern | What it shows |
|--------|---------|---------------|
| Happy path | Simple queue | Basic FIFO flow, no failures |
| Competing consumers | Work queue | Load balancing across M consumers |
| Broadcast | Pub/sub | Same message reaches everyone |
| Selective routing | Routing/topic | Only matching consumers receive |
| Backpressure | Work queue | Producer rate > consumer throughput + low capacity → producers block |
| Poison messages | Work queue | Low ack% → requeue storm → DLQ fills |
| Slow consumer | Work queue | One consumer paused → others absorb; kill → in-flight nacked |

Presets live as plain JS config objects (topology + params), shareable via the same URL encoding as manual setups.

## 14. Resolved decisions

1. **Routing/topic matching**: AMQP-style wildcards (`*` one word, `#` zero+ words) in v1. Educational value justifies the scope.
2. **Preset scenarios**: shipped in v1, fully adjustable after load (see §13).
3. **Metrics sparkline history**: 10s rolling window. Keep memory flat and simple.
