import { useRef, useState } from "react";
import { useStore } from "../sim/store";
import type { SimState } from "../sim/types";
import { AlertTriangle, ChevronDown } from "lucide-react";

const GLOSSARY: Record<string, string> = {
  producer:
    "A producer sends messages into the queue. It doesn't know or care who will consume them.",
  consumer:
    "A consumer reads messages from the queue and processes them. It can acknowledge (ack) or reject (nack) each message.",
  queue:
    "A buffer that stores messages between producers and consumers. Messages are delivered in FIFO order.",
  FIFO: "First In, First Out. The first message added to the queue is the first one delivered to a consumer.",
  ack: "Acknowledgment. The consumer confirms it processed the message successfully. The message is then removed from the queue.",
  nack: "Negative acknowledgment. The consumer signals it failed to process the message. The message is sent back to the queue for retry.",
  requeue:
    "Putting a failed message back into the queue so it can be retried by another consumer.",
  DLQ: "Dead Letter Queue. A separate queue where messages go after exceeding the maximum number of delivery attempts. They sit there for manual inspection.",
  backpressure:
    "When the queue is full, producers can't push new messages. They have to wait until space frees up. This is called backpressure.",
  exchange:
    "An exchange receives messages from producers and routes them to one or more queues based on rules (fanout or topic).",
  fanout:
    "A fanout exchange copies every message to all queues bound to it. Every consumer receives every message.",
  routing:
    "A routing key is a label attached to each message. The exchange uses it to decide which queues should receive the message.",
  binding:
    "A binding key is a pattern attached to a queue. The exchange compares the message's routing key against each queue's binding key to decide delivery. Wildcards: * matches one word, # matches zero or more.",
  "competing consumers":
    "When multiple consumers read from the same queue, each message is delivered to exactly one consumer. This distributes the workload.",
  inFlight:
    "A message is in-flight while a consumer is processing it but hasn't yet acknowledged or rejected it.",
  throughput:
    "The rate at which a consumer can process messages, measured in messages per second.",
  redelivery:
    "When a nacked message is requeued and delivered again. After too many redeliveries, the message goes to the DLQ.",
  "work queue":
    "A single queue with multiple consumers. Each message is handled by exactly one consumer, distributing the workload across them.",
  "dead letter":
    "A message that has been rejected or expired. Dead-lettered messages are routed to a Dead Letter Queue for inspection or reprocessing.",
  "poison message":
    "A message that consistently fails processing every time it's delivered. It gets redelivered repeatedly until it hits the max retry limit and is dead-lettered.",
  "load balancing":
    "Distributing work across multiple consumers so no single consumer becomes a bottleneck. The work queue pattern achieves this naturally.",
  "wildcard matching":
    "AMQP topic matching: * matches exactly one word in the routing key, # matches zero or more words. Words are separated by dots.",
  competing:
    "When multiple consumers share one queue, they compete for messages. Each message goes to only one consumer.",
  dropped:
    "A message is dropped when it can't be delivered to any queue because all matching queues are full. The message is lost. This is the cost of not having enough capacity or consumers.",
};

function Keyword({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  const def = GLOSSARY[term];
  if (!def) return <>{children}</>;
  return (
    <span className="group relative inline-block">
      <span className="border-b-2 border-swiss-accent cursor-help">
        {children}
      </span>
      <span
        className="pointer-events-none absolute left-0 bottom-full mb-1 z-50
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   bg-black text-white px-3 py-2 text-xs font-medium normal-case tracking-normal
                   leading-relaxed w-64 whitespace-normal rounded-none block"
      >
        <span className="font-black uppercase tracking-widest text-swiss-accent block mb-1">
          {term}
        </span>
        {def}
      </span>
    </span>
  );
}

const PRESET_DESCRIPTIONS: Record<
  string,
  { title: string; body: React.ReactNode }
> = {
  happy: {
    title: "01. SIMPLE QUEUE / THE HAPPY PATH",
    body: (
      <>
        One <Keyword term="producer">producer</Keyword> sends messages into a{" "}
        <Keyword term="queue">queue</Keyword>. One{" "}
        <Keyword term="consumer">consumer</Keyword> picks them up in{" "}
        <Keyword term="FIFO">FIFO</Keyword> order, first in, first out. The
        producer and consumer are decoupled: the producer doesn't wait for the
        consumer, and the consumer doesn't wait for the producer. The queue sits
        between them as a buffer.
        <br />
        <br />
        In this scenario the rates are balanced and every message is{" "}
        <Keyword term="ack">acknowledged</Keyword> successfully. Nothing fails,
        nothing retries. This is the baseline. Watch the colored tokens flow
        left to right, stack briefly in the queue, then disappear at the
        consumer.
      </>
    ),
  },
  competing: {
    title: "02. WORK QUEUE / COMPETING CONSUMERS",
    body: (
      <>
        Three <Keyword term="competing consumers">competing consumers</Keyword>{" "}
        share a single <Keyword term="queue">queue</Keyword>. Each message goes
        to exactly one consumer, never duplicated. This is{" "}
        <Keyword term="load balancing">load balancing</Keyword> by queue: if one
        consumer is busy, the next message goes to a free one.
        <br />
        <br />
        Watch how tokens distribute across the three consumers. No two consumers
        process the same message. If one slows down, the others absorb the
        slack. This pattern scales horizontally: add more consumers to increase
        aggregate <Keyword term="throughput">throughput</Keyword>.
      </>
    ),
  },
  broadcast: {
    title: "03. PUB/SUB / BROADCAST TO ALL",
    body: (
      <>
        A <Keyword term="producer">producer</Keyword> sends messages to an{" "}
        <Keyword term="exchange">exchange</Keyword> configured as{" "}
        <Keyword term="fanout">fanout</Keyword>. The exchange ignores routing
        keys entirely and copies every message to <em>all</em> bound queues.
        Each queue feeds one <Keyword term="consumer">consumer</Keyword>, so
        every consumer receives every message.
        <br />
        <br />
        This is fundamentally different from the work queue. In a work queue,
        one message goes to one consumer. In pub/sub, one message goes to every
        consumer. Watch a single token leave the producer, hit the exchange,
        then split into copies that travel to all three consumers
        simultaneously.
      </>
    ),
  },
  routing: {
    title: "04. TOPIC ROUTING / SELECTIVE DELIVERY",
    body: (
      <>
        Producers tag each message with a{" "}
        <Keyword term="routing">routing key</Keyword> (e.g.
        <code className="mx-1 px-1 bg-swiss-muted border border-black">
          logs.error.app1
        </code>
        ). Each queue declares a <Keyword term="binding">binding key</Keyword>{" "}
        pattern. The <Keyword term="exchange">exchange</Keyword> compares the
        routing key against each binding and delivers only to matching queues.
        <br />
        <br />
        <Keyword term="wildcard matching">Wildcard matching</Keyword> applies
        here:{" "}
        <code className="mx-1 px-1 bg-swiss-muted border border-black">*</code>{" "}
        matches one word,{" "}
        <code className="mx-1 px-1 bg-swiss-muted border border-black">#</code>{" "}
        matches zero or more. So{" "}
        <code className="mx-1 px-1 bg-swiss-muted border border-black">
          logs.error.*
        </code>{" "}
        catches{" "}
        <code className="mx-1 px-1 bg-swiss-muted border border-black">
          logs.error.app1
        </code>
        , and{" "}
        <code className="mx-1 px-1 bg-swiss-muted border border-black">
          logs.#
        </code>{" "}
        catches everything starting with{" "}
        <code className="mx-1 px-1 bg-swiss-muted border border-black">
          logs.
        </code>
        . Watch how messages from the two producers route to only the consumers
        whose bindings match.
      </>
    ),
  },
  backpressure: {
    title: "05. BACKPRESSURE / WHEN THE QUEUE FILLS UP",
    body: (
      <>
        The producer is sending at 5 msgs/sec, but the two consumers can only
        drain 1 msg/sec each. The queue capacity is deliberately tiny (15). The
        queue fills rapidly. Once full, the producer hits{" "}
        <Keyword term="backpressure">backpressure</Keyword>: it can't push new
        messages and has to wait.
        <br />
        <br />
        Watch the red warning bar appear at the top of the canvas. The producer
        node flashes{" "}
        <span className="text-swiss-accent font-bold">BLOCKED</span> and the
        queue bar hits 100%. Messages stop flowing until consumers drain enough
        to free space. In real systems, backpressure prevents memory blowout.
        Without it, a fast producer and slow consumer would eventually crash the
        broker. In fanout patterns, a full queue means messages get{" "}
        <Keyword term="dropped">dropped</Keyword> instead of buffered.
      </>
    ),
  },
  poison: {
    title: "06. POISON MESSAGES / THE NACK LOOP",
    body: (
      <>
        The consumer's <Keyword term="ack">ack</Keyword> rate is set to 40%,
        meaning 60% of messages are <Keyword term="nack">nacked</Keyword>{" "}
        (rejected as failed). A nacked message is{" "}
        <Keyword term="requeue">requeued</Keyword> and redelivered. If it keeps
        failing, it's a <Keyword term="poison message">poison message</Keyword>:
        it clogs the queue with endless{" "}
        <Keyword term="redelivery">redeliveries</Keyword>.
        <br />
        <br />
        After 3 failed deliveries (the max redelivery limit), the message is
        sent to the <Keyword term="DLQ">Dead Letter Queue</Keyword>, a separate
        queue where poisoned messages sit for manual inspection. Watch the{" "}
        <span className="text-swiss-accent font-bold">DLQ</span> fill up as
        repeated failures accumulate. This protects the system: bad messages
        stop blocking good ones.
      </>
    ),
  },
  slow: {
    title: "07. SLOW CONSUMER / BOTTLENECK IN THE PIPELINE",
    body: (
      <>
        One consumer processes at 0.5 msgs/sec, four times slower than the
        others. The producer sends at 3 msgs/sec. The fast consumers absorb most
        of the load, but the slow one still contributes. This is the{" "}
        <Keyword term="competing">competing consumers</Keyword> pattern hiding a
        bottleneck.
        <br />
        <br />
        Click <span className="font-bold">KILL CONSUMER</span> below to simulate
        a crash. The killed consumer's{" "}
        <Keyword term="inFlight">in-flight</Keyword> messages are nacked and
        requeued, so they return to the queue and get picked up by the surviving
        consumers. This is how message queues provide resilience: if one worker
        dies, the others take over.
      </>
    ),
  },
  custom: {
    title: "CUSTOM TOPOLOGY",
    body: (
      <>
        You've built a custom configuration. The topology above reflects your
        current pattern and node settings. Use the{" "}
        <span className="font-bold">TRY IT</span> buttons below to inject
        failures, pause consumers, or flood the queue, then watch how the system
        reacts.
        <br />
        <br />
        Hover any{" "}
        <span className="border-b-2 border-swiss-accent">
          underlined term
        </span>{" "}
        in the description for a definition. Click any node on the canvas to
        configure its rate, ack percentage, or routing key.
      </>
    ),
  },
};

interface Stats {
  queued: number;
  processing: number;
  blocked: number;
  fullQueues: number;
  paused: number;
  dead: number;
  dlq: number;
}

function computeStats(s: SimState): Stats {
  return {
    queued: s.queues
      .filter((q) => !q.isDlq)
      .reduce((a, q) => a + q.depth.length, 0),
    processing: s.consumers.reduce((a, c) => a + c.inFlight.length, 0),
    blocked: s.producers.filter((p) => p.blocked).length,
    fullQueues: s.queues.filter((q) => !q.isDlq && q.depth.length >= q.capacity)
      .length,
    paused: s.consumers.filter((c) => c.paused).length,
    dead: s.consumers.filter((c) => c.killed).length,
    dlq: s.queues.find((q) => q.isDlq)?.depth.length ?? 0,
  };
}

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="px-2 py-1.5 flex flex-col items-center justify-center bg-white">
      <span className="font-medium text-[9px] uppercase tracking-widest opacity-50">
        {label}
      </span>
      <span
        className={`font-black text-sm tabular-nums ${accent ? "text-swiss-accent" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function LearnPanel() {
  const sim = useStore((s) => s.sim);

  const preset =
    PRESET_DESCRIPTIONS[sim.presetId] ?? PRESET_DESCRIPTIONS.custom;

  const isFlooding = sim.flooded;

  // Freeze impact panel props when it first appears. Values never change
  // after snapshot, so content is stable and readable. Cleared on reset.
  const impactRef = useRef<{
    hasDrops: boolean;
    droppedCount: number;
    hasDead: boolean;
    isPoisoned: boolean;
  } | null>(null);

  if (isFlooding && !impactRef.current) {
    impactRef.current = {
      hasDrops: sim.droppedTotal > 0,
      droppedCount: sim.droppedTotal,
      hasDead: sim.everKilled,
      isPoisoned: sim.dlqdTotal > 0,
    };
  }
  if (!isFlooding) {
    impactRef.current = null;
  }

  const stats = computeStats(sim);

  return (
    <div className="flex flex-col gap-4">
      {/* description */}
      <div className="border-l-4 border-swiss-accent pl-4">
        <span className="font-black text-xs uppercase tracking-widest text-swiss-accent block mb-2">
          {preset.title}
        </span>
        <p className="text-sm leading-relaxed">{preset.body}</p>
      </div>

      {/* live status - fixed grid, always visible */}
      <div className="border-2 border-black">
        <div className="grid grid-cols-3 md:grid-cols-4 divide-x-2 divide-y-2 divide-black">
          <StatCell label="QUEUED" value={stats.queued} />
          <StatCell label="PROCESSING" value={stats.processing} />
          <StatCell label="ACKED" value={sim.ackedTotal} />
          <StatCell
            label="NACKED"
            value={sim.nackedTotal}
            accent={sim.nackedTotal > 0}
          />
          <StatCell
            label="BLOCKED"
            value={stats.blocked}
            accent={stats.blocked > 0}
          />
          <StatCell
            label="FULL Q"
            value={stats.fullQueues}
            accent={stats.fullQueues > 0}
          />
          <StatCell
            label="PAUSED"
            value={stats.paused}
            accent={stats.paused > 0}
          />
          <StatCell label="KILLED" value={stats.dead} accent={stats.dead > 0} />
          <StatCell label="DLQ" value={stats.dlq} accent={stats.dlq > 0} />
          <StatCell
            label="DROPPED"
            value={sim.droppedTotal}
            accent={sim.droppedTotal > 0}
          />
          <StatCell label="REQUEUE" value={sim.requeuedTotal} />
          <StatCell
            label="STATUS"
            value={sim.running ? "RUN" : "STOP"}
            accent={sim.flooded}
          />
        </div>
      </div>

      {/* flood / failure impact panel - props frozen at first appearance */}
      {isFlooding && impactRef.current && (
        <FloodImpact
          hasDrops={impactRef.current.hasDrops}
          droppedCount={impactRef.current.droppedCount}
          hasDead={impactRef.current.hasDead}
          isPoisoned={impactRef.current.isPoisoned}
        />
      )}

      {/* glossary hint */}
      <p className="text-xs font-medium opacity-40">
        Hover underlined terms for definitions.
      </p>
    </div>
  );
}

function FloodImpact({
  hasDrops,
  droppedCount,
  hasDead,
  isPoisoned,
}: {
  hasDrops: boolean;
  droppedCount: number;
  hasDead: boolean;
  isPoisoned: boolean;
}) {
  return (
    <div className="border-2 border-swiss-accent bg-white">
      <div className="bg-swiss-accent text-white px-4 py-2 flex items-center gap-2">
        <AlertTriangle size={14} strokeWidth={2.5} />
        <span className="font-black text-xs uppercase tracking-widest">
          SYSTEM UNDER STRESS / IMPACT ANALYSIS
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* what is happening */}
        <Section title="WHAT IS HAPPENING">
          <p className="text-sm leading-relaxed">
            Producers cannot push messages because the queue has hit full
            capacity. The system is experiencing{" "}
            <Keyword term="backpressure">backpressure</Keyword>.
            {hasDrops
              ? ` ${droppedCount} message${droppedCount > 1 ? "s have" : " has"} been dropped because no queue could accept them.`
              : " No messages have been dropped yet, but producers are blocked."}
            {hasDead &&
              " A consumer has crashed. Its in-flight messages were nacked and returned to the queue."}
            {isPoisoned &&
              " Poison messages are cycling through repeated redeliveries and filling up the Dead Letter Queue."}
          </p>
        </Section>

        {/* application impact */}
        <Section title="IMPACT ON YOUR APPLICATION">
          <ul className="text-sm leading-relaxed flex flex-col gap-1.5">
            <li className="flex gap-2">
              <span className="text-swiss-accent font-black shrink-0">!</span>
              <span>
                Producers are stalling. Upstream services calling them may time
                out, cascade failures, or hang indefinitely waiting for a
                response.
              </span>
            </li>
            {hasDrops && (
              <li className="flex gap-2">
                <span className="text-swiss-accent font-black shrink-0">!</span>
                <span>
                  Messages are being lost. Orders, events, or tasks that were
                  sent will never be processed. This is silent{" "}
                  <strong>data loss</strong> unless producers implement retry or
                  persistence.
                </span>
              </li>
            )}
            <li className="flex gap-2">
              <span className="text-swiss-accent font-black shrink-0">!</span>
              <span>
                Consumers are overwhelmed. Processing latency grows as the queue
                backs up. Users see stale data, delayed confirmations, or failed
                requests.
              </span>
            </li>
            {hasDead && (
              <li className="flex gap-2">
                <span className="text-swiss-accent font-black shrink-0">!</span>
                <span>
                  A consumer is down. Throughput drops, the remaining consumers
                  take on more load, and they may also fail under increased
                  pressure.
                </span>
              </li>
            )}
            {isPoisoned && (
              <li className="flex gap-2">
                <span className="text-swiss-accent font-black shrink-0">!</span>
                <span>
                  Bad messages are wasting resources. Each redelivery consumes
                  consumer time and network bandwidth for work that will never
                  succeed.
                </span>
              </li>
            )}
          </ul>
        </Section>

        {/* remediation */}
        <Section title="REMEDIATION">
          <ul className="text-sm leading-relaxed flex flex-col gap-1.5">
            <li className="flex gap-2">
              <span className="font-black shrink-0 text-black">+</span>
              <span>
                <strong>Scale consumers.</strong> Add more consumers or increase
                their throughput to drain the queue faster than producers fill
                it.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-black shrink-0 text-black">+</span>
              <span>
                <strong>Increase queue capacity.</strong> A larger buffer
                absorbs bursts, but only buys time. It doesn't fix a sustained
                rate mismatch.
              </span>
            </li>
            {hasDrops && (
              <li className="flex gap-2">
                <span className="font-black shrink-0 text-black">+</span>
                <span>
                  <strong>Enable persistence and retries.</strong> Producers
                  should retry on failure, or write to a local spill buffer.
                  Consider a dead-letter policy for undeliverable messages
                  instead of silent drops.
                </span>
              </li>
            )}
            {hasDead && (
              <li className="flex gap-2">
                <span className="font-black shrink-0 text-black">+</span>
                <span>
                  <strong>Restart or replace the consumer.</strong> Use health
                  checks and auto-restart policies. The queue pattern means
                  surviving consumers pick up the slack automatically.
                </span>
              </li>
            )}
            {isPoisoned && (
              <li className="flex gap-2">
                <span className="font-black shrink-0 text-black">+</span>
                <span>
                  <strong>Fix or filter poison messages.</strong> Set a max
                  redelivery count (as this simulator does) and route failures
                  to a <Keyword term="DLQ">DLQ</Keyword>. Investigate and
                  reprocess DLQ messages manually.
                </span>
              </li>
            )}
            <li className="flex gap-2">
              <span className="font-black shrink-0 text-black">+</span>
              <span>
                <strong>Throttle producers.</strong> If consumers can't keep up,
                slow down the producers. Backpressure is a signal, not a bug.
                Respect it.
              </span>
            </li>
          </ul>
        </Section>

        {/* recovery */}
        <Section title="RECOVERY & DATA LOSS">
          <div className="text-sm leading-relaxed flex flex-col gap-1.5">
            {hasDrops ? (
              <>
                <p>
                  <span className="text-swiss-accent font-black">
                    DATA LOSS:{" "}
                  </span>
                  {droppedCount} message{droppedCount > 1 ? "s were" : " was"}{" "}
                  permanently lost during this flood. They were sent by
                  producers but no queue could accept them. There is no
                  automatic recovery for dropped messages. The data is gone
                  unless the producer kept a copy or implemented a retry
                  strategy.
                </p>
                <div className="border-l-2 border-swiss-accent pl-3 flex flex-col gap-1.5">
                  <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
                    HOW TO RECOVER
                  </span>
                  <p>
                    <strong>Option 1: Producer-side retry.</strong> The producer
                    keeps a copy of each message and retries on failure. If the
                    queue was only briefly full, the retry succeeds once it
                    drains. This is the most common pattern: send, wait for ack,
                    retry on timeout.
                  </p>
                  <p>
                    <strong>Option 2: Local spill buffer.</strong> The producer
                    writes to a local file or database first, then forwards to
                    the queue. If the queue rejects the message, it stays in the
                    local buffer and gets forwarded later. Nothing is lost even
                    if the queue is down for hours.
                  </p>
                  <p>
                    <strong>Option 3: Dead-letter on the producer side.</strong>{" "}
                    If a message can't be delivered after N retries, the
                    producer stores it in its own dead-letter store for manual
                    reprocessing. Similar to a consumer DLQ, but owned by the
                    producer.
                  </p>
                  <p>
                    <strong>Option 4: Accept the loss.</strong> For some
                    workloads (metrics, logs, best-effort events) losing
                    messages is acceptable. The producer fires and forgets. No
                    retry, no persistence. This trades reliability for
                    simplicity and throughput.
                  </p>
                  <p className="opacity-60 text-xs">
                    In this simulator, dropped messages cannot be recovered.
                    Press RESET to clear the state and start fresh. To prevent
                    drops, increase queue capacity or add more consumers before
                    flooding.
                  </p>
                </div>
              </>
            ) : (
              <p>
                <span className="text-black font-black">NO DATA LOSS: </span>
                Messages are buffered, not lost. Producers are blocked but no
                messages have been dropped. Once consumers drain the queue,
                producers will resume and all messages will be delivered. The
                queue acts as a shock absorber.
              </p>
            )}
            {hasDead && (
              <p>
                <span className="text-black font-black">
                  CONSUMER RECOVERY:{" "}
                </span>
                The killed consumer's in-flight messages were automatically
                requeued. They will be redelivered to surviving consumers. No
                data was lost from the crash itself, only from the temporary
                throughput reduction.
              </p>
            )}
            {isPoisoned && (
              <p>
                <span className="text-black font-black">DLQ RECOVERY: </span>
                Poison messages in the Dead Letter Queue need manual
                intervention: inspect, fix the underlying issue, and reprocess.
                They will not automatically return to the main queue.
              </p>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function QueueDiagram() {
  return (
    <svg
      viewBox="0 0 600 140"
      className="w-full h-auto border-2 border-black bg-white"
    >
      <rect x="20" y="40" width="120" height="60" fill="black" />
      <text
        x="80"
        y="75"
        textAnchor="middle"
        fill="white"
        style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}
      >
        Producer
      </text>

      <line x1="140" y1="70" x2="220" y2="70" stroke="black" strokeWidth="3" />
      <polygon points="220,70 210,63 210,77" fill="black" />

      <rect
        x="230"
        y="30"
        width="140"
        height="80"
        fill="white"
        stroke="black"
        strokeWidth="3"
      />
      <text
        x="300"
        y="55"
        textAnchor="middle"
        fill="black"
        style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}
      >
        Queue
      </text>
      <rect x="245" y="65" width="20" height="30" fill="#ff3000" />
      <rect x="270" y="65" width="20" height="30" fill="#ff3000" />
      <rect x="295" y="65" width="20" height="30" fill="#ff3000" />
      <rect x="320" y="65" width="20" height="30" fill="#ff3000" />

      <line x1="370" y1="70" x2="450" y2="70" stroke="black" strokeWidth="3" />
      <polygon points="450,70 440,63 440,77" fill="black" />

      <rect x="460" y="40" width="120" height="60" fill="black" />
      <text
        x="520"
        y="75"
        textAnchor="middle"
        fill="white"
        style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}
      >
        Consumer
      </text>
    </svg>
  );
}

function RolesDiagram() {
  return (
    <svg viewBox="0 0 600 160" className="w-full h-auto border-2 border-black bg-white">
      <rect x="20" y="50" width="140" height="60" fill="black" />
      <text x="90" y="85" textAnchor="middle" fill="white" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
        Producer
      </text>
      <text x="90" y="132" textAnchor="middle" fill="black" style={{ fontSize: 10, fontWeight: 700 }}>
        creates work
      </text>

      <line x1="160" y1="80" x2="225" y2="80" stroke="black" strokeWidth="3" />
      <polygon points="225,80 215,73 215,87" fill="black" />

      <rect x="230" y="40" width="140" height="80" fill="white" stroke="black" strokeWidth="3" />
      <text x="300" y="65" textAnchor="middle" fill="black" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
        Queue
      </text>
      <rect x="245" y="75" width="18" height="28" fill="#ff3000" />
      <rect x="267" y="75" width="18" height="28" fill="#ff3000" />
      <rect x="289" y="75" width="18" height="28" fill="#ff3000" />
      <rect x="311" y="75" width="18" height="28" fill="#ff3000" />
      <text x="300" y="135" textAnchor="middle" fill="black" style={{ fontSize: 10, fontWeight: 700 }}>
        holds &amp; orders messages
      </text>

      <line x1="370" y1="80" x2="435" y2="80" stroke="black" strokeWidth="3" />
      <polygon points="435,80 425,73 425,87" fill="black" />

      <rect x="440" y="50" width="140" height="60" fill="black" />
      <text x="510" y="85" textAnchor="middle" fill="white" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
        Consumer
      </text>
      <text x="510" y="132" textAnchor="middle" fill="black" style={{ fontSize: 10, fontWeight: 700 }}>
        does the work
      </text>
    </svg>
  );
}

function DirectVsQueueDiagram() {
  return (
    <svg viewBox="0 0 680 200" className="w-full h-auto border-2 border-black bg-white">
      {/* Direct side */}
      <text x="150" y="25" textAnchor="middle" fill="#ff3000" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
        WITHOUT QUEUE
      </text>
      <rect x="50" y="50" width="100" height="40" fill="black" />
      <text x="100" y="75" textAnchor="middle" fill="white" style={{ fontSize: 9, fontWeight: 900 }}>
        API / HTTP
      </text>
      <line x1="150" y1="70" x2="200" y2="70" stroke="black" strokeWidth="2" />
      <polygon points="200,70 192,65 192,75" fill="black" />
      <rect x="200" y="50" width="100" height="40" fill="#ff3000" />
      <text x="250" y="75" textAnchor="middle" fill="white" style={{ fontSize: 9, fontWeight: 900 }}>
        Slow Service
      </text>
      <path d="M 100 95 L 100 120" stroke="black" strokeWidth="2" strokeDasharray="4,3" />
      <text x="150" y="130" textAnchor="middle" fill="black" style={{ fontSize: 9 }}>
        caller blocks &amp; times out
      </text>
      <line x1="50" y1="135" x2="300" y2="135" stroke="black" strokeWidth="1" strokeDasharray="3,3" />

      {/* Queued side */}
      <text x="450" y="25" textAnchor="middle" fill="black" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
        WITH QUEUE
      </text>
      <rect x="330" y="50" width="90" height="40" fill="black" />
      <text x="375" y="75" textAnchor="middle" fill="white" style={{ fontSize: 9, fontWeight: 900 }}>
        Web Server
      </text>
      <line x1="420" y1="70" x2="450" y2="70" stroke="black" strokeWidth="2" />
      <polygon points="450,70 442,65 442,75" fill="black" />
      <rect x="450" y="50" width="90" height="40" fill="white" stroke="black" strokeWidth="2" />
      <text x="495" y="75" textAnchor="middle" fill="black" style={{ fontSize: 9, fontWeight: 900 }}>
        Queue
      </text>
      <line x1="540" y1="70" x2="570" y2="70" stroke="black" strokeWidth="2" />
      <polygon points="570,70 562,65 562,75" fill="black" />
      <rect x="570" y="50" width="90" height="40" fill="black" />
      <text x="615" y="75" textAnchor="middle" fill="white" style={{ fontSize: 9, fontWeight: 900 }}>
        Worker
      </text>
      <text x="495" y="120" textAnchor="middle" fill="black" style={{ fontSize: 9 }}>
        returns immediately
      </text>
      <text x="495" y="135" textAnchor="middle" fill="black" style={{ fontSize: 9 }}>
        worker processes when ready
      </text>
    </svg>
  );
}

function FifoDiagram() {
  return (
    <svg viewBox="0 0 600 130" className="w-full h-auto border-2 border-black bg-white">
      <text x="80" y="30" textAnchor="middle" fill="black" style={{ fontSize: 9, fontWeight: 700 }}>
        Messages entering
      </text>
      <line x1="40" y1="45" x2="160" y2="45" stroke="black" strokeWidth="2" strokeDasharray="3,3" />
      <rect x="50" y="50" width="30" height="30" fill="#ff3000" rx="2" />
      <text x="65" y="69" textAnchor="middle" fill="white" style={{ fontSize: 12, fontWeight: 900 }}>1</text>
      <rect x="85" y="50" width="30" height="30" fill="#ff3000" rx="2" />
      <text x="100" y="69" textAnchor="middle" fill="white" style={{ fontSize: 12, fontWeight: 900 }}>2</text>
      <rect x="120" y="50" width="30" height="30" fill="#ff3000" rx="2" />
      <text x="135" y="69" textAnchor="middle" fill="white" style={{ fontSize: 12, fontWeight: 900 }}>3</text>

      <line x1="155" y1="65" x2="195" y2="65" stroke="black" strokeWidth="3" />
      <polygon points="195,65 185,58 185,72" fill="black" />

      <rect x="200" y="35" width="140" height="60" fill="white" stroke="black" strokeWidth="3" />
      <text x="270" y="58" textAnchor="middle" fill="black" style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
        Queue
      </text>

      <line x1="340" y1="65" x2="380" y2="65" stroke="black" strokeWidth="3" />
      <polygon points="380,65 370,58 370,72" fill="black" />

      <rect x="385" y="50" width="30" height="30" fill="#ff3000" rx="2" stroke="black" strokeWidth="2" />
      <text x="400" y="69" textAnchor="middle" fill="white" style={{ fontSize: 12, fontWeight: 900 }}>1</text>

      <text x="400" y="115" textAnchor="middle" fill="black" style={{ fontSize: 9, fontWeight: 700 }}>
        1 arrives first, leaves first
      </text>
    </svg>
  );
}

function BackpressureDiagram() {
  return (
    <svg viewBox="0 0 600 150" className="w-full h-auto border-2 border-black bg-white">
      <rect x="20" y="40" width="120" height="50" fill="#ff3000" />
      <text x="80" y="62" textAnchor="middle" fill="white" style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
        Producer
      </text>
      <text x="80" y="78" textAnchor="middle" fill="white" style={{ fontSize: 9, fontWeight: 700 }}>
        BLOCKED
      </text>

      <line x1="140" y1="65" x2="195" y2="65" stroke="black" strokeWidth="3" strokeDasharray="5,4" />
      <text x="168" y="56" textAnchor="middle" fill="#ff3000" style={{ fontSize: 14, fontWeight: 900 }}>✗</text>

      <rect x="200" y="25" width="140" height="80" fill="white" stroke="#ff3000" strokeWidth="4" />
      <text x="270" y="48" textAnchor="middle" fill="#ff3000" style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
        Queue
      </text>
      <text x="270" y="62" textAnchor="middle" fill="#ff3000" style={{ fontSize: 9, fontWeight: 700 }}>
        FULL
      </text>
      <rect x="215" y="68" width="18" height="24" fill="#ff3000" />
      <rect x="237" y="68" width="18" height="24" fill="#ff3000" />
      <rect x="259" y="68" width="18" height="24" fill="#ff3000" />
      <rect x="281" y="68" width="18" height="24" fill="#ff3000" />
      <rect x="303" y="68" width="18" height="24" fill="#ff3000" />

      <line x1="340" y1="65" x2="420" y2="65" stroke="black" strokeWidth="2" />
      <polygon points="420,65 412,58 412,72" fill="black" />

      <rect x="425" y="40" width="120" height="50" fill="black" />
      <text x="485" y="62" textAnchor="middle" fill="white" style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
        Consumer
      </text>
      <text x="485" y="78" textAnchor="middle" fill="white" style={{ fontSize: 9, fontWeight: 700 }}>
        overwhelmed
      </text>
    </svg>
  );
}

function PoisonDiagram() {
  return (
    <svg viewBox="0 0 600 190" className="w-full h-auto border-2 border-black bg-white">
      {/* Retry loop arrow */}
      <path d="M 530 95 Q 560 95 560 60 Q 560 25 200 25 Q 80 25 80 60 Q 80 80 140 80" stroke="#ff3000" strokeWidth="2" fill="none" strokeDasharray="5,3" />
      <polygon points="140,80 130,74 130,86" fill="#ff3000" />
      <text x="420" y="18" textAnchor="middle" fill="#ff3000" style={{ fontSize: 9, fontWeight: 700 }}>
        retry (max 3)
      </text>

      <rect x="20" y="90" width="120" height="50" fill="black" />
      <text x="80" y="112" textAnchor="middle" fill="white" style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
        Producer
      </text>

      <line x1="140" y1="115" x2="200" y2="115" stroke="black" strokeWidth="2" />
      <polygon points="200,115 192,108 192,122" fill="black" />

      <rect x="205" y="80" width="130" height="70" fill="white" stroke="black" strokeWidth="2" />
      <text x="270" y="105" textAnchor="middle" fill="black" style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
        Queue
      </text>
      <rect x="218" y="115" width="16" height="24" fill="#ff3000" />
      <rect x="238" y="115" width="16" height="24" fill="#ff3000" />
      <rect x="258" y="115" width="16" height="24" fill="#ff3000" />

      <line x1="335" y1="115" x2="395" y2="115" stroke="black" strokeWidth="2" />
      <polygon points="395,115 387,108 387,122" fill="black" />

      <rect x="400" y="90" width="120" height="50" fill="black" />
      <text x="460" y="112" textAnchor="middle" fill="white" style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>
        Consumer
      </text>

      {/* DLQ */}
      <line x1="460" y1="145" x2="460" y2="170" stroke="black" strokeWidth="2" />
      <rect x="400" y="155" width="120" height="30" fill="white" stroke="#ff3000" strokeWidth="2" />
      <text x="460" y="174" textAnchor="middle" fill="#ff3000" style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>
        DLQ
      </text>
    </svg>
  );
}

interface FaqItem {
  title: string;
  summary: string;
  body: React.ReactNode;
  illustration?: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    title: "What is a message queue, in plain English?",
    summary:
      "A waiting line for digital work that decouples producers from consumers.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          Imagine a busy online food delivery service. A waiter takes an order
          and slides it onto a rail. The cook picks the order off the rail,
          cooks it, and slides it back. The waiter never has to wait for the
          cook, and the cook never has to wait for the waiter. The rail is the
          queue.
        </p>
        <p className="text-sm leading-relaxed">
          In software, a <Keyword term="producer">producer</Keyword> sends a
          message into the queue and immediately moves on to do other things. A{" "}
          <Keyword term="consumer">consumer</Keyword> picks up the message later
          when it's ready to process it. The queue sits between them as a
          buffer.
        </p>
        <div className="border-l-4 border-swiss-accent pl-3 text-sm leading-relaxed">
          <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
            Example
          </span>
          <p className="mt-1">
            A web server needs to send a welcome email after signup. Instead of
            sending the email directly (which takes 2-3 seconds), it pushes an
            "email task" message into the queue and responds to the user in
            milliseconds. A background worker reads the queue, sends the email,
            and removes the task. The web server never touches the email server.
          </p>
        </div>
      </>
    ),
    illustration: <QueueDiagram />,
  },
  {
    title: "Who are the main players?",
    summary:
      "Producer, queue/broker, and consumer each have a single, clear job.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          Every message queue has exactly three roles, and each role has one
          responsibility:
        </p>
        <ul className="text-sm leading-relaxed flex flex-col gap-1.5">
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">1.</span>
            <span>
              <strong>Producer</strong> creates messages and sends them to the
              queue. It never waits for a response. Example: a payment API
              emitting an "invoice generated" event after a successful
              charge.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">2.</span>
            <span>
              <strong>Queue / Broker</strong> stores messages in order and
              hands them out to consumers. It handles durability, ordering, and
              delivery guarantees. Popular brokers include RabbitMQ, Kafka, and
              Redis.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">3.</span>
            <span>
              <strong>Consumer</strong> pulls a message, processes it, and
              tells the queue whether it succeeded (
              <Keyword term="ack">ack</Keyword>) or failed (
              <Keyword term="nack">nack</Keyword>). Example: an email worker
              that reads "send welcome email" tasks and calls an SMTP server.
            </span>
          </li>
        </ul>
        <p className="text-sm leading-relaxed">
          Producers and consumers can be written in different languages,
          deployed on different machines, and scaled independently. The queue
          is the only shared dependency.
        </p>
      </>
    ),
    illustration: <RolesDiagram />,
  },
  {
    title: "What happens without a queue?",
    summary:
      "Direct calls couple components tightly. A queue decouples them entirely.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          Without a queue, service A calls service B directly over HTTP or RPC.
          Service A must wait for B's response. If B is slow or down, A is
          slow or broken. This is <strong>synchronous coupling</strong>.
        </p>
        <div className="border-l-4 border-swiss-accent pl-3 text-sm leading-relaxed">
          <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
            Real-world example
          </span>
          <p className="mt-1">
            An e-commerce site calls the payment gateway, inventory service,
            and email service in sequence. Each call adds latency. If the email
             service is down, the whole checkout fails, even though the
            customer doesn't need their email to complete the purchase.
          </p>
        </div>
        <p className="text-sm leading-relaxed">
          A queue fixes this with four big wins:
        </p>
        <ul className="text-sm leading-relaxed flex flex-col gap-1.5">
          <li className="flex gap-2">
            <span className="font-black shrink-0">+</span>
            <span>
              <strong>Decoupling</strong>: producers and consumers know
              nothing about each other. They only agree on the message format.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black shrink-0">+</span>
            <span>
              <strong>Async work</strong>: the producer sends a message and
              moves on. The consumer processes when free.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black shrink-0">+</span>
            <span>
              <strong>Load leveling</strong>: a burst of 1000 signups doesn't
              crash the email server. The queue absorbs the spike and the
              consumer drains at its own pace.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black shrink-0">+</span>
            <span>
              <strong>Resilience</strong>: if a consumer crashes, its messages
              stay in the queue. When it restarts (or another consumer picks
              them up), work resumes without data loss.
            </span>
          </li>
        </ul>
      </>
    ),
    illustration: <DirectVsQueueDiagram />,
  },
  {
    title: "What does FIFO mean?",
    summary:
      "First In, First Out: messages are delivered in the order they arrived.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          <Keyword term="FIFO">FIFO</Keyword> stands for "First In, First Out."
          The first message that enters the queue is the first one delivered to
          a consumer. Think of a ticket counter: the person who joins the line
          first is served first.
        </p>
        <div className="border-l-4 border-swiss-accent pl-3 text-sm leading-relaxed">
          <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
            Example
          </span>
          <p className="mt-1">
            A print queue processes jobs in FIFO order. If you submit your
            document before someone else, it prints first. This is predictable
            and fair. In some high-throughput systems, strict FIFO is relaxed
            to improve performance, but this simulator uses strict FIFO for
            clarity.
          </p>
        </div>
      </>
    ),
    illustration: <FifoDiagram />,
  },
  {
    title: "What patterns does this simulator show?",
    summary:
      "Simple queue, work queue, pub/sub, and topic routing cover the most common use cases.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          Each simulator preset demonstrates a real-world messaging pattern:
        </p>
        <ul className="text-sm leading-relaxed flex flex-col gap-1.5">
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">01</span>
            <span>
              <strong>Simple queue</strong>: one producer, one queue, one
              consumer. Use case: a log ingester that writes events to a file.
              Simple, reliable, the baseline.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">02</span>
            <span>
              <strong>Work queue / Competing consumers</strong>: multiple
              consumers drain one queue. Each message is processed once. Use
              case: image thumbnail generation: upload an image, one of ten
              workers resizes it.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">03</span>
            <span>
              <strong>Pub/Sub (fanout)</strong>: every message goes to{" "}
              <em>every</em> consumer. Use case: a price update broadcast to
              all services (catalog, search, recommendations).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">04</span>
            <span>
              <strong>Topic routing</strong>: messages are routed by key
              matching. Use case: log routing: <code>error</code> logs go to
              the alerting service, <code>info</code> logs go to the analytics
              service.
            </span>
          </li>
        </ul>
      </>
    ),

  },
  {
    title: "What is backpressure?",
    summary:
      "A full queue blocks the producer, protecting consumers from being overwhelmed.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          <Keyword term="backpressure">Backpressure</Keyword> occurs when the
          queue is completely full and the producer is blocked from sending
          more messages. This is not a bug; it's a safety valve. Without it, a
          fast producer could fill memory until the broker crashes.
        </p>
        <div className="border-l-4 border-swiss-accent pl-3 text-sm leading-relaxed">
          <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
            Example
          </span>
          <p className="mt-1">
            A flash sale generates 10,000 orders per second. The inventory
            service processes 500 orders per second. The queue fills up in
            seconds. Producers block, customers see a "please wait" message,
            but the system survives. Without backpressure, the broker would run
            out of memory and crash completely.
          </p>
        </div>
        <p className="text-sm leading-relaxed">
          Remedies include: scaling consumers, increasing queue capacity (buys
          time but does not fix a sustained mismatch), or throttling producers.
        </p>
      </>
    ),
    illustration: <BackpressureDiagram />,
  },
  {
    title: "What is a poison message?",
    summary:
      "A message that always fails gets retried, then sidelined to a Dead Letter Queue.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          A <Keyword term="poison message">poison message</Keyword> is one that
          fails every time a consumer tries to process it. Without safeguards,
          it would be requested forever, wasting resources and blocking healthy
          messages.
        </p>
        <div className="border-l-4 border-swiss-accent pl-3 text-sm leading-relaxed">
          <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
            Example
          </span>
          <p className="mt-1">
            An order message contains malformed JSON: a required field is
            missing. Every consumer that picks it up crashes. The queue
            requeues it. It gets delivered again. And again. After 3 retries
            (the max configured), the broker moves it to the{" "}
            <Keyword term="DLQ">Dead Letter Queue</Keyword> (DLQ). It sits
            there until an operator examines it, fixes the data, and
            reprocesses it. The main queue is no longer clogged.
          </p>
        </div>
        <p className="text-sm leading-relaxed">
          The DLQ is critical for production systems. It isolates bad messages
          so they don't bring down processing, and provides a place for manual
          or automated recovery.
        </p>
      </>
    ),
    illustration: <PoisonDiagram />,
  },
  {
    title: "When should I use a message queue?",
    summary:
      "Use a queue when work can happen later, speeds differ, or you need resilience.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          Message queues shine in these scenarios:
        </p>
        <ul className="text-sm leading-relaxed flex flex-col gap-1.5">
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">+</span>
            <span>
              <strong>Background jobs</strong>: send emails, resize images,
              generate PDFs, process video. The user clicks and gets a
              response immediately; the work happens behind the scenes.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">+</span>
            <span>
              <strong>Event-driven microservices</strong>: service A emits
              "order.placed", services B (inventory), C (billing), and D
              (shipping) react independently.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">+</span>
            <span>
              <strong>Data pipelines</strong>: ingest logs, metrics, or
              analytics events in large volumes. Kafka and Pulsar excel here.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">+</span>
            <span>
              <strong>Rate decoupling</strong>: a sensor reads 10,000
              readings/sec but the database only writes 1,000/sec. The queue
              absorbs the difference.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-black text-swiss-accent shrink-0">+</span>
            <span>
              <strong>Error resilience</strong>: if a worker crashes, the
              queue holds its work. No data loss, no need for complex recovery
              logic.
            </span>
          </li>
        </ul>
      </>
    ),
    illustration: (
      <div className="text-sm leading-relaxed bg-swiss-muted border-2 border-black p-3 flex flex-col gap-2">
        <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
          Good fit checklist
        </span>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked readOnly className="accent-swiss-accent" />
          Work can happen asynchronously
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked readOnly className="accent-swiss-accent" />
          Producer and consumer have different speeds
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked readOnly className="accent-swiss-accent" />
          You need to survive consumer crashes
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked readOnly className="accent-swiss-accent" />
          You want to scale workers independently
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked readOnly className="accent-swiss-accent" />
          Traffic arrives in bursts
        </label>
      </div>
    ),
  },
  {
    title: "Which open source message queue should I use?",
    summary:
      "RabbitMQ, Apache Kafka, Redis, NATS, Pulsar: each fits different use cases.",
    body: (
      <>
        <p className="text-sm leading-relaxed">
          The best broker depends on what you're building. Here's a breakdown
          of popular open source options and when to reach for each:
        </p>
        <div className="flex flex-col gap-3">
          <div className="border-2 border-black p-3 text-sm leading-relaxed">
            <a
              href="https://www.rabbitmq.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-swiss-accent text-xs hover:underline"
            >
              RabbitMQ ↗
            </a>
            <p className="mt-1">
              The best general-purpose choice. Supports AMQP, MQTT, and
              STOMP. Excellent routing (direct, topic, fanout, headers),
              reliable delivery, and a mature ecosystem.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Best for: work queues, pub/sub, routing. A great first queue.
            </p>
          </div>
          <div className="border-2 border-black p-3 text-sm leading-relaxed">
            <a
              href="https://kafka.apache.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-swiss-accent text-xs hover:underline"
            >
              Apache Kafka ↗
            </a>
            <p className="mt-1">
              Built for high-throughput event streaming. Messages are
              persisted on disk and replayable. Handles millions of
              messages/second with horizontal scaling.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Best for: data pipelines, log aggregation, event sourcing,
              analytics.
            </p>
          </div>
          <div className="border-2 border-black p-3 text-sm leading-relaxed">
            <a
              href="https://redis.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-swiss-accent text-xs hover:underline"
            >
              Redis (Streams / Lists) ↗
            </a>
            <p className="mt-1">
              In-memory, lightweight, sub-millisecond latency. Redis Streams
              provide consumer groups and persistent queues. No built-in
              routing or exchanges.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Best for: simple queues, real-time data, caching layers,
              lightweight pub/sub.
            </p>
          </div>
          <div className="border-2 border-black p-3 text-sm leading-relaxed">
            <a
              href="https://nats.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-swiss-accent text-xs hover:underline"
            >
              NATS ↗
            </a>
            <p className="mt-1">
              Ultra-fast, cloud-native messaging. Supports at-most-once and
              at-least-once delivery, pub/sub, request-reply, and JetStream
              for persistence.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Best for: IoT, microservices, real-time control systems, edge
              computing.
            </p>
          </div>
          <div className="border-2 border-black p-3 text-sm leading-relaxed">
            <a
              href="https://pulsar.apache.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-swiss-accent text-xs hover:underline"
            >
              Apache Pulsar ↗
            </a>
            <p className="mt-1">
              Multi-tenant, geo-replicated messaging with native support for
              both queues and streams. Separates compute and storage for
              elastic scaling.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Best for: large-scale deployments, multi-region, mixed
              queue/stream workloads.
            </p>
          </div>
          <div className="border-2 border-black p-3 text-sm leading-relaxed">
            <a
              href="https://activemq.apache.org/components/artemis/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-swiss-accent text-xs hover:underline"
            >
              ActiveMQ / Artemis ↗
            </a>
            <p className="mt-1">
              The JMS standard. Fits enterprise Java environments, supports
              XA transactions, and integrates with Jakarta EE.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Best for: enterprise Java applications, JMS compliance,
              transactional messaging.
            </p>
          </div>
          <div className="border-2 border-black p-3 text-sm leading-relaxed">
            <a
              href="https://zeromq.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-swiss-accent text-xs hover:underline"
            >
              ZeroMQ (ZMQ) ↗
            </a>
            <p className="mt-1">
              Not a broker: it's a low-level messaging library you embed in
              your application. Gives you sockets, patterns (pub/sub,
              push/pull, req/rep), and no central broker.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Best for: embedded messaging, low-latency systems, custom
              topologies.
            </p>
          </div>
        </div>
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <div className="flex flex-col gap-3 max-w-5xl mx-auto">
      {FAQ_ITEMS.map((item) => (
        <CollapsibleSection
          key={item.title}
          title={item.title}
          summary={item.summary}
          illustration={item.illustration}
        >
          {item.body}
        </CollapsibleSection>
      ))}
    </div>
  );
}

function CollapsibleSection({
  title,
  summary,
  children,
  illustration,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  illustration?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-2 border-black bg-white">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-swiss-muted transition-colors duration-200"
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
            {title}
          </span>
          <span className="text-sm opacity-60 leading-snug">{summary}</span>
        </div>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t-2 border-black p-4 flex flex-col gap-4">
          {children}
          {illustration && (
            <div className="flex flex-col gap-2">
              <span className="font-black text-[10px] uppercase tracking-widest text-swiss-accent">
                Visual
              </span>
              {illustration}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-black text-xs uppercase tracking-widest text-swiss-accent border-b border-black pb-1">
        {title}
      </span>
      {children}
    </div>
  );
}
