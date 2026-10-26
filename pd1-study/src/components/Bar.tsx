export default function Bar({ pct, color, label }: { pct: number; color?: string; label?: string }) {
  return (
    <div className="bar" role="img" aria-label={label ?? `${Math.round(pct)}%`}>
      <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}
