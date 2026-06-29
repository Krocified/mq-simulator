import { useStore } from "../sim/store";
import { PRESETS } from "../sim/presets";
import { Sparkles } from "lucide-react";

export function PresetBar() {
  const loadPreset = useStore((s) => s.loadPreset);
  const current = useStore((s) => s.sim.pattern);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 font-heading font-bold text-sm md:text-base">
        <Sparkles size={16} strokeWidth={3} /> Presets:
      </span>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => loadPreset(preset)}
          className="px-3 py-1 text-xs md:text-sm font-body border-2 border-dashed border-ink bg-postit hover:bg-accent hover:text-white hover:border-solid transition-all shadow-[2px_2px_0px_0px_#2d2d2d] hover:shadow-[1px_1px_0px_0px_#2d2d2d] hover:translate-x-[1px] hover:translate-y-[1px]"
          style={{ borderRadius: "65px 8px 70px 8px / 8px 70px 8px 65px", transform: `rotate(${(preset.id.length % 3) - 1}deg)` }}
          title={preset.name}
        >
          {preset.name}
        </button>
      ))}
      <span className="font-body text-xs text-ink/40 hidden md:inline">· adjustable after load</span>
      {current && <span className="sr-only">{current}</span>}
    </div>
  );
}
