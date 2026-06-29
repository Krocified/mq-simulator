import { useStore } from "../sim/store";
import { Skull, Pause, Zap, AlertTriangle, RotateCcw } from "lucide-react";

export function DemoActions() {
  const sim = useStore((s) => s.sim);
  const updateConsumer = useStore((s) => s.updateConsumer);
  const updateProducer = useStore((s) => s.updateProducer);

  const aliveConsumers = sim.consumers.filter((c) => !c.killed);
  const firstAlive = aliveConsumers[0];
  const anyPaused = sim.consumers.some((c) => c.paused);
  const anyDead = sim.consumers.some((c) => c.killed);
  const anyNacking = sim.consumers.some((c) => c.ackPct < 100 && !c.killed && !c.paused);
  const anyFlooded = sim.producers.some((p) => p.rate >= 8);

  const restoreAll = () => {
    sim.consumers.forEach((c) => {
      updateConsumer(c.id, { paused: false, killed: false, ackPct: 100 });
    });
    sim.producers.forEach((p) => {
      if (p.rate > 5) updateProducer(p.id, { rate: 2 });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="font-black text-xs uppercase tracking-widest text-swiss-accent">
        TRY IT:
      </span>
      <div className="flex flex-wrap gap-1.5">
        <DemoButton
          icon={<Skull size={12} strokeWidth={2.5} />}
          label="KILL CONSUMER"
          onClick={() => firstAlive && updateConsumer(firstAlive.id, { killed: true })}
          disabled={!firstAlive}
        />
        <DemoButton
          icon={<Pause size={12} strokeWidth={2.5} />}
          label={anyPaused ? "UNPAUSE ALL" : "PAUSE ALL"}
          onClick={() =>
            sim.consumers.forEach((c) =>
              updateConsumer(c.id, { paused: !anyPaused })
            )
          }
        />
        <DemoButton
          icon={<AlertTriangle size={12} strokeWidth={2.5} />}
          label={anyNacking ? "FIX ACK RATE" : "INJECT FAILURES"}
          onClick={() =>
            sim.consumers.forEach((c) =>
              updateConsumer(c.id, { ackPct: anyNacking ? 100 : 50 })
            )
          }
        />
        <DemoButton
          icon={<Zap size={12} strokeWidth={2.5} />}
          label={anyFlooded ? "CALM PRODUCERS" : "FLOOD QUEUE"}
          onClick={() =>
            sim.producers.forEach((p) =>
              updateProducer(p.id, { rate: anyFlooded ? 2 : 9 })
            )
          }
        />
        {(anyPaused || anyDead || anyNacking || anyFlooded) && (
          <DemoButton
            icon={<RotateCcw size={12} strokeWidth={2.5} />}
            label="RESTORE ALL"
            onClick={restoreAll}
            accent
          />
        )}
      </div>
    </div>
  );
}

function DemoButton({
  icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest border-2 border-black transition-colors duration-200 ease-out ${
        disabled
          ? "bg-swiss-muted opacity-40 cursor-not-allowed"
          : accent
          ? "bg-swiss-accent text-white hover:bg-black hover:text-white"
          : "bg-white text-black hover:bg-black hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}