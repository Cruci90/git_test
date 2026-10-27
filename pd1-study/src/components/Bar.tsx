import { useEffect, useState } from 'react';

export default function Bar({ pct, color, label }: { pct: number; color?: string; label?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(Math.max(0, Math.min(100, pct))));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <div className="bar" role="img" aria-label={label ?? `${Math.round(pct)}%`}>
      <div className="bar-fill" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}
