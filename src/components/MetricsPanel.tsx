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

  return (
    <div className="flex flex-col gap-2">
      <MetricCard label="IN RATE" value={`${rateIn.toFixed(1)}/S`} series={inSeries} color="#ff3000" />
      <MetricCard label="OUT RATE" value={`${rateOut.toFixed(1)}/S`} series={outSeries} color="#000000" />
      <MetricCard label="QUEUE DEPTH" value={`${totalDepth}`} series={depthSeries} color="#000000" />
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
