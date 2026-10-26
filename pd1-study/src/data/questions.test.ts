import { describe, expect, it } from 'vitest';
import { QUESTIONS } from './index';
import { CATEGORIES } from '../lib/categories';
import { examDistribution } from '../lib/quiz';

describe('question bank', () => {
  it('has between 100 and 300 questions', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(100);
    expect(QUESTIONS.length).toBeLessThanOrEqual(300);
  });

  it('has unique ids and unique question texts', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    expect(new Set(QUESTIONS.map((q) => q.q)).size).toBe(QUESTIONS.length);
  });

  it('is well formed', () => {
    for (const q of QUESTIONS) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(new Set(q.options).size, `${q.id} duplicate options`).toBe(q.options.length);
      expect(q.answer.length, q.id).toBeGreaterThanOrEqual(1);
      expect(new Set(q.answer).size, q.id).toBe(q.answer.length);
      for (const a of q.answer) expect(a >= 0 && a < q.options.length, q.id).toBe(true);
      expect(q.exp.length, q.id).toBeGreaterThan(30);
      if (q.answer.length > 1) expect(q.q, q.id).toMatch(/Choose \d/);
    }
  });

  it('covers every category with enough questions for an exam', () => {
    const dist = examDistribution();
    for (const c of CATEGORIES) {
      const n = QUESTIONS.filter((q) => q.category === c.id).length;
      expect(n, c.id).toBeGreaterThanOrEqual(dist[c.id]);
    }
  });
});
