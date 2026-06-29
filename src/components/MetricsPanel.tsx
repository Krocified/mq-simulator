import { useStore } from "../sim/store";
import { Sparkline } from "./Sparkline";
import { TrendingUp, TrendingDown, Inbox, Skull } from "lucide-react";

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
    <div className="flex flex-col gap-3">
      <MetricCard label="In rate" value={`${rateIn.toFixed(1)}/s`} icon={<TrendingUp size={16} strokeWidth={3} />} series={inSeries} color="#2d5da1" />
      <MetricCard label="Out rate" value={`${rateOut.toFixed(1)}/s`} icon={<TrendingDown size={16} strokeWidth={3} />} series={outSeries} color="#3a8a3a" />
      <MetricCard label="Queue depth" value={`${totalDepth}`} icon={<Inbox size={16} strokeWidth={3} />} series={depthSeries} color="#e08e0b" />
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Acked" value={sim.ackedTotal} color="text-ballpoint" />
        <Stat label="Nacked" value={sim.nackedTotal} color="text-accent" />
        <Stat label="Requeued" value={sim.requeuedTotal} color="text-ink/60" />
        <Stat label="DLQ" value={dlqCount} color="text-accent" icon={<Skull size={12} strokeWidth={3} />} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  series,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  series: number[];
  color: string;
}) {
  return (
    <div
      className="bg-white border-2 border-ink p-3 shadow-[3px_3px_0px_0px_rgba(45,45,45,0.15)]"
      style={{ borderRadius: "155px 25px 165px 25px / 25px 165px 25px 155px" }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 font-body text-sm text-ink/70">
          {icon} {label}
        </span>
        <span className="font-heading font-bold text-base" style={{ color }}>
          {value}
        </span>
      </div>
      <Sparkline data={series} color={color} width={180} height={28} />
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="bg-white border-2 border-ink/60 p-2 flex flex-col items-center"
      style={{ borderRadius: "65px 8px 70px 8px / 8px 70px 8px 65px" }}
    >
      <span className="font-body text-xs text-ink/60 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className={`font-heading font-bold text-lg ${color}`}>{value}</span>
    </div>
  );
}
