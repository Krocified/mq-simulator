export function Sparkline({
  data,
  color = "#000000",
  height = 28,
  className = "",
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  if (data.length < 2) {
    return <div style={{ height }} className={`text-[10px] uppercase tracking-wider opacity-30 flex items-center font-medium ${className}`}>—</div>;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 92 - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`overflow-visible ${className}`}
      style={{ height, width: "100%" }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="square"
        strokeLinejoin="miter"
        opacity={0.9}
      />
    </svg>
  );
}
