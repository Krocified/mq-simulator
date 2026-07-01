import { useStore } from "../sim/store";
import { PRESETS } from "../sim/presets";
import { ChevronDown } from "lucide-react";

export function PresetBar() {
  const loadPreset = useStore((s) => s.loadPreset);
  const sim = useStore((s) => s.sim);
  const activePreset = PRESETS.find((p) => p.id === sim.presetId);

  return (
    <>
      {/* mobile: dropdown */}
      <div className="lg:hidden relative w-full">
        <select
          value={sim.presetId ?? ""}
          onChange={(e) => {
            const preset = PRESETS.find((p) => p.id === e.target.value);
            if (preset) loadPreset(preset);
          }}
          className="appearance-none w-full px-3 py-2 pr-9 text-xs font-bold uppercase tracking-widest border-2 border-black bg-white cursor-pointer focus:border-swiss-accent focus:outline-none"
        >
          {!activePreset && <option value="">CUSTOM</option>}
          {PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        />
      </div>

      {/* desktop: horizontal buttons */}
      <div className="hidden lg:flex flex-wrap items-center gap-1">
        <span className="font-black text-xs uppercase tracking-widest mr-1">
          01. PRESETS
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => loadPreset(preset)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-black transition-all duration-200 ease-out hover:bg-swiss-accent hover:text-white ${
              sim.presetId === preset.id
                ? "bg-swiss-accent text-white"
                : "bg-white"
            }`}
            title={preset.name}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </>
  );
}