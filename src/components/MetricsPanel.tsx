import { useStore } from "../sim/store";
import { Sparkline } from "./Sparkline";

export function MetricsPanel() {
  const sim = useStore((s) => s.sim);

  const h = sim.history;
  const windowSecs = h.length > 1 ? sim.tick - h[0].tick : 1;
  const rateIn = h.length > 1 ? (sim.producedTotal - h[0].produced) / windowSecs : 0;
  const rateOut = h.length > 1 ? (sim.ackedTotal - h[0].acked) / windowSecs : 0;

  const inSeries = h.map((s) => s.produced);
  const outSeries = h.map((s) => s.acked);
  const depthSeries = h.length > 0
    ? h.map((s) => Object.values(s.queueDepths).reduce((a, b) => a + b, 0))
    : [];

  const totalDepth = sim.queues.filter((q) => !q.isDlq).reduce((a, q) => a + q.depth.length, 0);
  const dlqCount = sim.queues.find((q) => q.isDlq)?.depth.length ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <MetricCard label="IN RATE" value={`${rateIn.toFixed(1)}/S`} series={inSeries} color="#ff3000" />
      <MetricCard label="OUT RATE" value={`${rateOut.toFixed(1)}/S`} series={outSeries} color="#000000" />
      <MetricCard label="QUEUE DEPTH" value={`${totalDepth}`} series={depthSeries} color="#000000" />
      <div className="grid grid-cols-2 gap-0 border-2 border-black">
        <Stat label="ACKED" value={sim.ackedTotal} />
        <Stat label="NACKED" value={sim.nackedTotal} accent />
        <Stat label="REQUEUE" value={sim.requeuedTotal} />
        <Stat label="DLQ" value={dlqCount} accent />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  series,
  color,
}: {
  label: string;
  value: string;
  series: number[];
  color: string;
}) {
  return (
    <div className="bg-white border-2 border-black p-3 swiss-dots">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-xs uppercase tracking-widest opacity-70">{label}</span>
        <span className="font-black text-base" style={{ color }}>
          {value}
        </span>
      </div>
      <Sparkline data={series} color={color} width={200} height={28} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`p-2 flex flex-col items-center border-r-2 border-b-2 border-black last:border-r-0 [&:nth-last-child(-n+2)]:border-b-0`}>
      <span className="font-medium text-[10px] uppercase tracking-widest opacity-60">{label}</span>
      <span className={`font-black text-lg ${accent ? "text-swiss-accent" : ""}`}>{value}</span>
    </div>
  );
}
