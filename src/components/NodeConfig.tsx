import { useStore } from "../sim/store";
import { Button } from "../ui/components";
import { Trash2, Pause, Play, Skull, RotateCcw } from "lucide-react";

export function NodeConfig({ selected }: { selected: string | null }) {
  const sim = useStore((s) => s.sim);
  const updateProducer = useStore((s) => s.updateProducer);
  const removeProducer = useStore((s) => s.removeProducer);
  const updateConsumer = useStore((s) => s.updateConsumer);
  const removeConsumer = useStore((s) => s.removeConsumer);
  const updateQueueCapacity = useStore((s) => s.updateQueueCapacity);
  const setMaxRedeliveries = useStore((s) => s.setMaxRedeliveries);

  if (!selected) {
    return (
      <div className="p-6 font-medium text-xs uppercase tracking-widest opacity-40 text-center">
        Click a node to configure
      </div>
    );
  }

  const producer = sim.producers.find((p) => p.id === selected);
  const consumer = sim.consumers.find((c) => c.id === selected);
  const queue = sim.queues.find((q) => q.id === selected && !q.isDlq);

  if (producer) {
    return (
      <Panel title={`02. PRODUCER P${producer.id.slice(1)}`}>
        <Slider
          label="Rate (msgs/sec)"
          min={0.1}
          max={10}
          step={0.1}
          value={producer.rate}
          onChange={(v) => updateProducer(producer.id, { rate: v })}
        />
        {sim.pattern === "routing" && (
          <TextInput
            label="Routing key"
            value={producer.routingKey}
            onChange={(v) => updateProducer(producer.id, { routingKey: v })}
            placeholder="logs.error.app1"
          />
        )}
        <div className="text-xs uppercase tracking-wider opacity-60">EMITTED: {producer.totalEmitted}</div>
        <RemoveButton onClick={() => removeProducer(producer.id)} />
      </Panel>
    );
  }

  if (consumer) {
    return (
      <Panel title={`03. CONSUMER C${consumer.id.slice(1)}`}>
        <Slider
          label="Throughput (msgs/sec)"
          min={0.1}
          max={10}
          step={0.1}
          value={consumer.throughput}
          onChange={(v) => updateConsumer(consumer.id, { throughput: v })}
        />
        <Slider
          label="Ack probability (%)"
          min={0}
          max={100}
          step={5}
          value={consumer.ackPct}
          onChange={(v) => updateConsumer(consumer.id, { ackPct: v })}
        />
        {sim.pattern === "routing" && queue && (
          <TextInput
            label="Binding key"
            value={queue.bindingKey}
            onChange={() => {}}
            placeholder="logs.*"
            readOnly
          />
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            active={consumer.paused}
            onClick={() => updateConsumer(consumer.id, { paused: !consumer.paused })}
          >
            <span className="flex items-center gap-1">
              {consumer.paused ? <Play size={12} strokeWidth={2.5} /> : <Pause size={12} strokeWidth={2.5} />}
              {consumer.paused ? "RESUME" : "PAUSE"}
            </span>
          </Button>
          {consumer.killed ? (
            <Button
              variant="ghost"
              onClick={() => updateConsumer(consumer.id, { killed: false })}
            >
              <span className="flex items-center gap-1">
                <RotateCcw size={12} strokeWidth={2.5} /> REVIVE
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => updateConsumer(consumer.id, { killed: true })}
            >
              <span className="flex items-center gap-1">
                <Skull size={12} strokeWidth={2.5} /> KILL
              </span>
            </Button>
          )}
          <RemoveButton onClick={() => removeConsumer(consumer.id)} />
        </div>
        <div className="flex gap-4 text-xs uppercase tracking-wider opacity-60">
          <span>ACKED: {consumer.totalAcked}</span>
          <span>NACKED: {consumer.totalNacked}</span>
        </div>
      </Panel>
    );
  }

  if (queue) {
    return (
      <Panel title="04. QUEUE">
        <Slider
          label="Capacity"
          min={10}
          max={500}
          step={10}
          value={queue.capacity}
          onChange={(v) => updateQueueCapacity(v)}
        />
        <Slider
          label="Max redeliveries"
          min={1}
          max={10}
          step={1}
          value={sim.maxRedeliveries}
          onChange={(v) => setMaxRedeliveries(v)}
        />
        <div className="text-xs uppercase tracking-wider opacity-60">
          DEPTH: {queue.depth.length} / {queue.capacity}
        </div>
      </Panel>
    );
  }

  return null;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <h3 className="font-black text-sm uppercase tracking-widest text-swiss-accent border-b-2 border-black pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium text-xs uppercase tracking-wider opacity-70">{label}: <span className="font-black text-black">{value}</span></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium text-xs uppercase tracking-wider opacity-70">{label}</span>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 border-2 border-black bg-white text-sm font-medium rounded-none focus:border-swiss-accent focus:outline-none"
      />
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick}>
      <span className="flex items-center gap-1">
        <Trash2 size={12} strokeWidth={2.5} /> REMOVE
      </span>
    </Button>
  );
}
