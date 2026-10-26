import type { ExamResult, ExamSession, Progress, Question, QuestionStat } from '../types';
import { isCorrect } from './quiz';

const KEY = 'pd1-study:v1';

export const emptyProgress = (): Progress => ({ version: 1, stats: {}, exams: [], activeExam: null });

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage full or unavailable: keep working in memory */
  }
}

/** Validate unknown data (from storage or an imported file) into a Progress object. */
export function normalize(data: unknown): Progress {
  const base = emptyProgress();
  if (!data || typeof data !== 'object') return base;
  const d = data as Partial<Progress>;
  if (d.stats && typeof d.stats === 'object') base.stats = d.stats as Progress['stats'];
  if (Array.isArray(d.exams)) base.exams = d.exams as ExamResult[];
  if (d.activeExam && typeof d.activeExam === 'object' && Array.isArray(d.activeExam.questionIds)) {
    base.activeExam = d.activeExam as ExamSession;
  }
  return base;
}

export function recordAnswer(p: Progress, q: Question, selected: readonly number[], now = Date.now()): Progress {
  const ok = isCorrect(q, selected);
  const prev: QuestionStat = p.stats[q.id] ?? { seen: 0, correct: 0, lastCorrect: true, last: 0 };
  return {
    ...p,
    stats: {
      ...p.stats,
      [q.id]: { seen: prev.seen + 1, correct: prev.correct + (ok ? 1 : 0), lastCorrect: ok, last: now }
    }
  };
}

export function failedIds(p: Progress): string[] {
  return Object.entries(p.stats)
    .filter(([, s]) => !s.lastCorrect)
    .map(([id]) => id);
}
