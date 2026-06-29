import { useStore } from "../sim/store";
import type { Pattern } from "../sim/types";
import { Button } from "../ui/components";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";

const PATTERNS: { id: Pattern; label: string }[] = [
  { id: "simple", label: "Simple" },
  { id: "work", label: "Work" },
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
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-2 border-black rounded-none">
      {/* transport */}
      <div className="flex gap-2">
        {sim.running ? (
          <Button onClick={pause} title="Pause">
            <span className="flex items-center gap-1.5"><Pause size={16} strokeWidth={2.5} /> PAUSE</span>
          </Button>
        ) : (
          <Button onClick={play} title="Play">
            <span className="flex items-center gap-1.5"><Play size={16} strokeWidth={2.5} /> PLAY</span>
          </Button>
        )}
        <Button variant="secondary" onClick={step} title="Step one tick">
          <span className="flex items-center gap-1.5"><SkipForward size={16} strokeWidth={2.5} /> STEP</span>
        </Button>
        <Button variant="ghost" onClick={reset} title="Reset">
          <span className="flex items-center gap-1.5"><RotateCcw size={16} strokeWidth={2.5} /> RESET</span>
        </Button>
      </div>

      {/* speed */}
      <div className="flex items-center gap-2 px-2 border-l-2 border-black h-10">
        <span className="font-medium text-xs uppercase tracking-widest opacity-70">SPEED</span>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={sim.speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-20"
        />
        <span className="font-black text-sm w-10">{sim.speed.toFixed(2)}X</span>
      </div>

      {/* pattern selector */}
      <div className="flex flex-wrap gap-0 ml-auto border-2 border-black">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPattern(p.id)}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ease-out border-r-2 border-black last:border-r-0 ${
              sim.pattern === p.id
                ? "bg-swiss-accent text-white"
                : "bg-white text-black hover:bg-black hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
