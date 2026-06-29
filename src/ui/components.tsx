import { type ReactNode, type CSSProperties } from "react";

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
  const variants: Record<Variant, string> = {
    primary: active
      ? "bg-swiss-accent text-white border-2 border-black"
      : "bg-black text-white border-2 border-black hover:bg-swiss-accent hover:text-white",
    secondary: active
      ? "bg-swiss-accent text-white border-2 border-black"
      : "bg-white text-black border-2 border-black hover:bg-black hover:text-white",
    ghost:
      "bg-transparent text-black border-2 border-black hover:bg-swiss-muted",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className={`px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-widest rounded-none transition-colors duration-200 ease-out select-none ${variants[variant]}`}
      style={{ ...style }}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`bg-white border-2 border-black rounded-none ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
