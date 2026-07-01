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
    <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-2 md:gap-3 p-3 md:p-4 bg-white border-2 border-black rounded-none">
      {/* line 1: transport + speed */}
      <div className="flex items-center justify-between lg:justify-start gap-1.5 md:gap-2">
        <div className="flex items-center gap-1.5 md:gap-2">
          {sim.running ? (
            <Button onClick={pause} title="Pause">
              <span className="flex items-center gap-1 md:gap-1.5">
                <Pause size={14} strokeWidth={2.5} className="md:hidden" />
                <Pause size={16} strokeWidth={2.5} className="hidden md:block" />
                <span className="hidden sm:inline">PAUSE</span>
              </span>
            </Button>
          ) : (
            <Button onClick={play} title="Play">
              <span className="flex items-center gap-1 md:gap-1.5">
                <Play size={14} strokeWidth={2.5} className="md:hidden" />
                <Play size={16} strokeWidth={2.5} className="hidden md:block" />
                <span className="hidden sm:inline">PLAY</span>
              </span>
            </Button>
          )}
          <Button variant="secondary" onClick={step} title="Step one tick">
            <span className="flex items-center gap-1 md:gap-1.5">
              <SkipForward size={14} strokeWidth={2.5} className="md:hidden" />
              <SkipForward size={16} strokeWidth={2.5} className="hidden md:block" />
              <span className="hidden sm:inline">STEP</span>
            </span>
          </Button>
          <Button variant="ghost" onClick={reset} title="Reset">
            <span className="flex items-center gap-1 md:gap-1.5">
              <RotateCcw size={14} strokeWidth={2.5} className="md:hidden" />
              <RotateCcw size={16} strokeWidth={2.5} className="hidden md:block" />
              <span className="hidden sm:inline">RESET</span>
            </span>
          </Button>
        </div>

        {/* speed */}
        <div className="flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 border-l-2 border-black h-8 md:h-10">
          <span className="font-medium text-[10px] md:text-xs uppercase tracking-widest opacity-70">SPD</span>
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.25}
            value={sim.speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-14 md:w-20"
          />
          <span className="font-black text-xs md:text-sm w-10">{sim.speed.toFixed(2)}X</span>
        </div>
      </div>

      {/* line 2: pattern selector — full width evenly spaced on mobile */}
      <div className="flex w-full lg:w-auto lg:ml-auto border-2 border-black divide-x-2 divide-black">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPattern(p.id)}
            className={`flex-1 lg:flex-none px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors duration-200 ease-out text-center ${
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
