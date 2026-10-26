import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Progress } from './types';
import { loadProgress, saveProgress } from './lib/storage';

interface Ctx {
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  replace: (p: Progress) => void;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveProgress(progress);
  }, [progress]);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress(fn), []);
  const replace = useCallback((p: Progress) => setProgress(p), []);
  const value = useMemo(() => ({ progress, update, replace }), [progress, update, replace]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
