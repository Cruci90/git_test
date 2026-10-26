import type { CategoryId, ExamResult, ExamSession, Question } from '../types';
import { CATEGORIES } from './categories';

export const EXAM_QUESTIONS = 60;
export const EXAM_MINUTES = 105;
export const PASS_PCT = 68;

export type Rng = () => number;

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isCorrect(q: Question, selected: readonly number[]): boolean {
  if (selected.length !== q.answer.length) return false;
  const set = new Set(selected);
  return q.answer.every((a) => set.has(a));
}

export function makeOrder(q: Question, rng: Rng = Math.random): number[] {
  return shuffle(q.options.map((_, i) => i), rng);
}

/** Split `total` across categories proportionally to exam weights (largest remainder). */
export function examDistribution(total = EXAM_QUESTIONS): Record<CategoryId, number> {
  const sum = CATEGORIES.reduce((s, c) => s + c.weight, 0);
  const raw = CATEGORIES.map((c) => ({ id: c.id, exact: (c.weight / sum) * total }));
  const out = Object.fromEntries(raw.map((r) => [r.id, Math.floor(r.exact)])) as Record<CategoryId, number>;
  let left = total - Object.values(out).reduce((s, n) => s + n, 0);
  raw
    .sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))
    .forEach((r) => {
      if (left > 0) {
        out[r.id]++;
        left--;
      }
    });
  return out;
}

export function pickExamQuestions(bank: readonly Question[], rng: Rng = Math.random, total = EXAM_QUESTIONS): Question[] {
  const dist = examDistribution(total);
  const picked: Question[] = [];
  for (const c of CATEGORIES) {
    const pool = shuffle(bank.filter((q) => q.category === c.id), rng);
    picked.push(...pool.slice(0, dist[c.id]));
  }
  // Top up if a category has too few questions.
  if (picked.length < total) {
    const ids = new Set(picked.map((q) => q.id));
    picked.push(...shuffle(bank.filter((q) => !ids.has(q.id)), rng).slice(0, total - picked.length));
  }
  return shuffle(picked, rng);
}

export function newExamSession(bank: readonly Question[], now = Date.now(), rng: Rng = Math.random): ExamSession {
  const qs = pickExamQuestions(bank, rng);
  return {
    id: `exam-${now}`,
    startedAt: now,
    durationMs: EXAM_MINUTES * 60_000,
    questionIds: qs.map((q) => q.id),
    orders: Object.fromEntries(qs.map((q) => [q.id, makeOrder(q, rng)])),
    answers: {},
    flagged: []
  };
}

export function scoreExam(session: ExamSession, bank: readonly Question[], now = Date.now()): ExamResult {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c.id, { total: 0, correct: 0 }])) as ExamResult['byCategory'];
  const items: ExamResult['items'] = [];
  let correct = 0;
  for (const id of session.questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const selected = session.answers[id] ?? [];
    const ok = isCorrect(q, selected);
    byCategory[q.category].total++;
    if (ok) {
      byCategory[q.category].correct++;
      correct++;
    }
    items.push({ id, selected, ok });
  }
  const total = items.length;
  const pct = total ? Math.round((correct / total) * 1000) / 10 : 0;
  return {
    id: session.id,
    date: now,
    total,
    correct,
    pct,
    passed: pct >= PASS_PCT,
    usedMs: Math.min(now - session.startedAt, session.durationMs),
    byCategory,
    items,
    orders: session.orders
  };
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
