import { type ReactNode, type CSSProperties } from "react";
import { WOBBLY_MD } from "./wobbly";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  children,
  onClick,
  variant = "primary",
  active,
  title,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  active?: boolean;
  title?: string;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    borderRadius: WOBBLY_MD,
    transition: "all 100ms",
  };
  const variants: Record<Variant, string> = {
    primary: active
      ? "bg-accent text-white border-[3px] border-ink shadow-[2px_2px_0px_0px_#2d2d2d] translate-x-[1px] translate-y-[1px]"
      : "bg-white text-ink border-[3px] border-ink shadow-[4px_4px_0px_0px_#2d2d2d] hover:bg-accent hover:text-white hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
    secondary: active
      ? "bg-ballpoint text-white border-[3px] border-ink shadow-[2px_2px_0px_0px_#2d2d2d] translate-x-[1px] translate-y-[1px]"
      : "bg-muted text-ink border-[3px] border-ink shadow-[4px_4px_0px_0px_#2d2d2d] hover:bg-ballpoint hover:text-white hover:shadow-[2px_2px_0px_0px_#2d2d2d] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]",
    ghost:
      "bg-transparent text-ink border-2 border-dashed border-ink hover:bg-muted hover:shadow-[2px_2px_0px_0px_#2d2d2d]",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className={`px-4 py-2 text-base md:text-lg font-body select-none ${variants[variant]}`}
      style={{ ...base, ...style }}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  rotate,
  style,
  decoration,
}: {
  children: ReactNode;
  className?: string;
  rotate?: string;
  style?: CSSProperties;
  decoration?: "tape" | "tack" | "none";
}) {
  return (
    <div
      className={`relative bg-white border-2 border-ink ${className}`}
      style={{ borderRadius: WOBBLY_MD, transform: rotate ? `rotate(${rotate})` : undefined, ...style }}
    >
      {decoration === "tape" && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-ink/15 border border-ink/20"
          style={{ borderRadius: "4px 8px 4px 6px", transform: "rotate(-3deg)" }}
        />
      )}
      {decoration === "tack" && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent border-2 border-ink shadow-[1px_1px_0px_0px_#2d2d2d]" />
      )}
      {children}
    </div>
  );
}
