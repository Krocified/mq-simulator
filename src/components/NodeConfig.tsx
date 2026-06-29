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
      <div className="p-4 font-body text-sm text-ink/50 text-center">
        Click a node to configure it.
      </div>
    );
  }

  const producer = sim.producers.find((p) => p.id === selected);
  const consumer = sim.consumers.find((c) => c.id === selected);
  const queue = sim.queues.find((q) => q.id === selected && !q.isDlq);

  if (producer) {
    return (
      <Panel title={`Producer P${producer.id.slice(1)}`} color={producer.color}>
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
        <div className="text-xs text-ink/50 font-body">Emitted: {producer.totalEmitted}</div>
        <RemoveButton onClick={() => removeProducer(producer.id)} />
      </Panel>
    );
  }

  if (consumer) {
    return (
      <Panel title={`Consumer C${consumer.id.slice(1)}`}>
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
            <span className="flex items-center gap-1 text-sm">
              {consumer.paused ? <Play size={14} strokeWidth={3} /> : <Pause size={14} strokeWidth={3} />}
              {consumer.paused ? "Resume" : "Pause"}
            </span>
          </Button>
          {consumer.killed ? (
            <Button
              variant="ghost"
              onClick={() => updateConsumer(consumer.id, { killed: false })}
            >
              <span className="flex items-center gap-1 text-sm">
                <RotateCcw size={14} strokeWidth={2.5} /> Revive
              </span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => updateConsumer(consumer.id, { killed: true })}
            >
              <span className="flex items-center gap-1 text-sm">
                <Skull size={14} strokeWidth={2.5} /> Kill
              </span>
            </Button>
          )}
        </div>
        <div className="flex gap-4 text-xs text-ink/50 font-body">
          <span>Acked: {consumer.totalAcked}</span>
          <span>Nacked: {consumer.totalNacked}</span>
        </div>
        <RemoveButton onClick={() => removeConsumer(consumer.id)} />
      </Panel>
    );
  }

  if (queue) {
    return (
      <Panel title="Queue">
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
        <div className="text-xs text-ink/50 font-body">
          Depth: {queue.depth.length} / {queue.capacity}
        </div>
      </Panel>
    );
  }

  return null;
}

function Panel({ title, children, color }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {color && (
          <div className="w-3 h-3 border border-ink" style={{ borderRadius: "60% 40% 50% 50%", background: color }} />
        )}
        <h3 className="font-heading font-bold text-base">{title}</h3>
      </div>
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
      <span className="font-body text-sm text-ink/70">{label}: <span className="font-heading text-ink">{value}</span></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-ballpoint"
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
      <span className="font-body text-sm text-ink/70">{label}</span>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 border-2 border-ink bg-white text-sm font-body focus:border-ballpoint focus:outline-none focus:ring-2 focus:ring-ballpoint/20"
        style={{ borderRadius: "65px 8px 70px 8px / 8px 70px 8px 65px" }}
      />
    </label>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick}>
      <span className="flex items-center gap-1 text-sm">
        <Trash2 size={14} strokeWidth={2.5} /> Remove
      </span>
    </Button>
  );
}
