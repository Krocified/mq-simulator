import { useStore } from "../sim/store";
import type { Pattern } from "../sim/types";
import { Button } from "../ui/components";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

const PATTERNS: { id: Pattern; label: string }[] = [
  { id: "simple", label: "Simple" },
  { id: "work", label: "Work queue" },
  { id: "pubsub", label: "Pub/Sub" },
  { id: "routing", label: "Routing" },
];

export function Controls() {
  const sim = useStore((s) => s.sim);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);
  const step = useStore((s) => s.step);
  const reset = useStore((s) => s.reset);
  const setSpeed = useStore((s) => s.setSpeed);
  const setPattern = useStore((s) => s.setPattern);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 md:p-4 bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#2d2d2d]"
      style={{ borderRadius: "155px 25px 165px 25px / 25px 165px 25px 155px" }}
    >
      {/* transport */}
      <div className="flex gap-2">
        {sim.running ? (
          <Button onClick={pause} title="Pause">
            <span className="flex items-center gap-1"><Pause size={18} strokeWidth={3} /> Pause</span>
          </Button>
        ) : (
          <Button onClick={play} title="Play">
            <span className="flex items-center gap-1"><Play size={18} strokeWidth={3} /> Play</span>
          </Button>
        )}
        <Button variant="secondary" onClick={step} title="Step one tick">
          <span className="flex items-center gap-1"><SkipForward size={18} strokeWidth={3} /> Step</span>
        </Button>
        <Button variant="ghost" onClick={reset} title="Reset">
          <span className="flex items-center gap-1"><RotateCcw size={18} strokeWidth={2.5} /> Reset</span>
        </Button>
      </div>

      {/* speed */}
      <div className="flex items-center gap-2 px-2">
        <span className="font-body text-sm text-ink/70">Speed</span>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={sim.speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-20 accent-ballpoint"
        />
        <span className="font-body text-sm w-8">{sim.speed.toFixed(2)}x</span>
      </div>

      {/* pattern selector */}
      <div className="flex flex-wrap gap-1.5 ml-auto">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPattern(p.id)}
            className={`px-3 py-1.5 text-sm font-body border-2 border-ink transition-all ${
              sim.pattern === p.id
                ? "bg-accent text-white shadow-[2px_2px_0px_0px_#2d2d2d] translate-x-[1px] translate-y-[1px]"
                : "bg-white text-ink hover:bg-muted shadow-[3px_3px_0px_0px_#2d2d2d]"
            }`}
            style={{ borderRadius: "65px 8px 70px 8px / 8px 70px 8px 65px" }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
