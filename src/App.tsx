import { useState } from "react";
import { Canvas } from "./components/Canvas";
import { Controls } from "./components/Controls";
import { PresetBar } from "./components/PresetBar";
import { NodeConfig } from "./components/NodeConfig";
import { MetricsPanel } from "./components/MetricsPanel";
import { LearnPanel, FaqSection } from "./components/LearnPanel";
import { DemoActions } from "./components/DemoActions";
import { useStore } from "./sim/store";
import { Link2, Copy, Github, Linkedin, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      {/* header — compact single row */}
      <header className="border-b-2 border-black px-4 md:px-6 py-3 flex items-center justify-between gap-4 bg-swiss-muted swiss-dots">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">
            MQ Simulator
          </h1>
          <span className="text-xs font-bold uppercase tracking-widest text-swiss-accent">
            by Kro
          </span>
          <span className="font-medium text-xs uppercase tracking-widest opacity-50 hidden sm:inline ml-2">
            See the queue breathe
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <PresetBar />
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest border-2 border-black bg-white hover:bg-black hover:text-white transition-colors duration-200 ease-out"
            title="Copy shareable URL"
          >
            {copied ? (
              <Copy size={14} strokeWidth={2.5} />
            ) : (
              <Link2 size={14} strokeWidth={2.5} />
            )}
            {copied ? "COPIED" : "SHARE"}
          </button>
        </div>
      </header>

      {/* mobile preset row */}
      <div className="lg:hidden border-b-2 border-black px-4 py-2 bg-swiss-muted swiss-dots">
        <PresetBar />
      </div>

      {/* main — asymmetric 8:4 grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 border-b-4 border-black">
        <main className="lg:col-span-8 flex flex-col gap-3 p-4 md:p-6 border-r-0 lg:border-r-4 border-black">
          <Canvas selected={selected} onSelect={setSelected} />
          <Controls />
        </main>

        {/* sidebar */}
<aside className="lg:col-span-4 flex flex-col border-t-4 lg:border-t-0 border-black">
          <div className="border-b-2 border-black p-4 bg-swiss-muted swiss-dots">
            <span className="font-black text-xs uppercase tracking-widest text-swiss-accent block mb-3">
              02. METRICS
            </span>
            <MetricsPanel />
          </div>
          <div className="border-b-2 border-black p-4 bg-white">
            <DemoActions />
          </div>
          <div className="p-4 flex-1 min-h-[285px]">
            <NodeConfig selected={selected} />
          </div>
        </aside>
      </div>

      {/* learn panel */}
      <div className="px-4 md:px-6 py-4 border-t-2 border-black bg-swiss-muted swiss-grid-pattern">
        <span className="font-black text-xs uppercase tracking-widest text-swiss-accent block mb-3">
          03. WHAT'S HAPPENING
        </span>
        <LearnPanel />
      </div>

      {/* FAQ */}
      <div className="px-4 md:px-6 py-4 border-t-2 border-black bg-white">
        <span className="font-black text-xs uppercase tracking-widest text-swiss-accent block mb-3">
          04. MESSAGE QUEUING FAQ
        </span>
        <FaqSection />
      </div>

      <footer className="px-6 md:px-12 py-4 border-t-2 border-black bg-swiss-muted swiss-dots">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="font-medium text-xs uppercase tracking-widest opacity-50">
              Educational simulator, semantics modeled, not wire-accurate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-xs uppercase tracking-widest text-swiss-accent">
              by Kro
            </span>
            <a
              href="https://github.com/Krocified"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest border-2 border-black bg-white hover:bg-black hover:text-white transition-colors duration-200 ease-out"
            >
              <Github size={12} strokeWidth={2.5} />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/maxjoong/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest border-2 border-black bg-white hover:bg-black hover:text-white transition-colors duration-200 ease-out"
            >
              <Linkedin size={12} strokeWidth={2.5} />
              LinkedIn
            </a>
            <a
              href="https://github.com/Krocified/mq-simulator/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold uppercase tracking-widest border-2 border-black bg-swiss-accent text-white hover:bg-black hover:text-white transition-colors duration-200 ease-out"
            >
              <AlertCircle size={12} strokeWidth={2.5} />
              REPORT ISSUES
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
