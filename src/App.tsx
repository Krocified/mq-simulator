import { useState } from "react";
import { Canvas } from "./components/Canvas";
import { Controls } from "./components/Controls";
import { PresetBar } from "./components/PresetBar";
import { NodeConfig } from "./components/NodeConfig";
import { MetricsPanel } from "./components/MetricsPanel";
import { useStore } from "./sim/store";
import { Link2, Copy } from "lucide-react";

export default function App() {
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shareUrl = useStore((s) => s.shareUrl);

  const handleShare = async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this URL:", url);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* header — asymmetric, thick border */}
      <header className="border-b-4 border-black px-6 md:px-12 py-6 md:py-8 flex flex-wrap items-end justify-between gap-4 swiss-grid-pattern">
        <div>
          <span className="font-black text-xs uppercase tracking-widest text-swiss-accent block mb-1">01. SYSTEM</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
            MQ Simulator
          </h1>
          <p className="font-medium text-sm md:text-base uppercase tracking-wider opacity-60 mt-2">
            See the queue breathe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PresetBar />
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest border-2 border-black bg-white hover:bg-black hover:text-white transition-colors duration-200 ease-out"
            title="Copy shareable URL"
          >
            {copied ? <Copy size={14} strokeWidth={2.5} /> : <Link2 size={14} strokeWidth={2.5} />}
            {copied ? "COPIED" : "SHARE"}
          </button>
        </div>
      </header>

      {/* main — asymmetric 8:4 grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 border-b-4 border-black">
        <main className="lg:col-span-8 flex flex-col gap-3 p-4 md:p-6 border-r-0 lg:border-r-4 border-black">
          <Canvas selected={selected} onSelect={setSelected} />
        </main>

        {/* sidebar */}
        <aside className="lg:col-span-4 flex flex-col border-t-4 lg:border-t-0 border-black">
          <div className="border-b-2 border-black p-4 bg-swiss-muted swiss-dots">
            <span className="font-black text-xs uppercase tracking-widest text-swiss-accent block mb-3">02. METRICS</span>
            <MetricsPanel />
          </div>
          <div className="p-4 flex-1">
            <NodeConfig selected={selected} />
          </div>
        </aside>
      </div>

      {/* controls — full width, bottom */}
      <div className="p-4 md:p-6 border-t-2 border-black bg-white">
        <Controls />
      </div>

      <footer className="px-6 md:px-12 py-4 border-t-2 border-black font-medium text-xs uppercase tracking-widest opacity-50">
        Educational simulator · semantics modeled, not wire-accurate
      </footer>
    </div>
  );
}
