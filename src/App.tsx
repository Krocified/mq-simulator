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
    <div className="min-h-screen flex flex-col px-4 md:px-6 py-4 gap-4 max-w-7xl mx-auto">
      {/* header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold leading-none">
            MQ Simulator
          </h1>
          <p className="font-body text-sm md:text-base text-ink/60">
            See the queue breathe.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PresetBar />
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-body border-2 border-ink bg-white hover:bg-muted shadow-[3px_3px_0px_0px_#2d2d2d] hover:shadow-[1px_1px_0px_0px_#2d2d2d] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            style={{ borderRadius: "65px 8px 70px 8px / 8px 70px 8px 65px" }}
            title="Copy shareable URL"
          >
            {copied ? <Copy size={14} strokeWidth={3} /> : <Link2 size={14} strokeWidth={3} />}
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </header>

      {/* main */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        <div className="flex-1 flex flex-col gap-3">
          <Canvas selected={selected} onSelect={setSelected} />
        </div>

        {/* sidebar */}
        <aside className="lg:w-72 flex flex-col gap-3 shrink-0">
          <Section title="Metrics" decoration="tape">
            <MetricsPanel />
          </Section>
          <Section title="Configure">
            <NodeConfig selected={selected} />
          </Section>
        </aside>
      </div>

      {/* controls */}
      <Controls />

      <footer className="font-body text-xs text-ink/40 text-center py-2">
        Educational simulator · semantics modeled, not wire-accurate
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
  decoration,
}: {
  title: string;
  children: React.ReactNode;
  decoration?: "tape" | "tack";
}) {
  return (
    <div
      className="relative bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#2d2d2d]"
      style={{ borderRadius: "155px 25px 165px 25px / 25px 165px 25px 155px" }}
    >
      {decoration === "tape" && (
        <div
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-14 h-5 bg-ink/15 border border-ink/20"
          style={{ borderRadius: "3px 6px 4px 5px", transform: "rotate(-2deg)" }}
        />
      )}
      <h2 className="font-heading font-bold text-lg px-4 pt-3 pb-1">{title}</h2>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}
