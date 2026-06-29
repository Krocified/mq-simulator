import { useStore } from "../sim/store";
import { PRESETS } from "../sim/presets";

export function PresetBar() {
  const loadPreset = useStore((s) => s.loadPreset);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="font-black text-xs uppercase tracking-widest mr-1">01. PRESETS</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => loadPreset(preset)}
          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-black bg-white transition-all duration-200 ease-out hover:bg-swiss-accent hover:text-white"
          title={preset.name}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}
