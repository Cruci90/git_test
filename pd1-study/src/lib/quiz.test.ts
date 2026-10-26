import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../data';
import { EXAM_MINUTES, EXAM_QUESTIONS, examDistribution, formatClock, isCorrect, newExamSession, pickExamQuestions, scoreExam, shuffle } from './quiz';
import { emptyProgress, failedIds, normalize, recordAnswer } from './storage';

const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe('quiz helpers', () => {
  it('examDistribution sums to 60 and follows weights', () => {
    const d = examDistribution();
    expect(Object.values(d).reduce((a, b) => a + b, 0)).toBe(60);
    expect(d).toEqual({ fundamentals: 14, automation: 18, ui: 15, testing: 13 });
  });

  it('shuffle keeps elements and does not mutate', () => {
    const a = [1, 2, 3, 4, 5];
    const s = shuffle(a, seeded());
    expect([...s].sort()).toEqual(a);
    expect(a).toEqual([1, 2, 3, 4, 5]);
  });

  it('isCorrect handles single and multi answers', () => {
    const single = QUESTIONS.find((q) => q.answer.length === 1)!;
    const multi = QUESTIONS.find((q) => q.answer.length === 2)!;
    expect(isCorrect(single, single.answer)).toBe(true);
    expect(isCorrect(single, [])).toBe(false);
    expect(isCorrect(multi, [...multi.answer].reverse())).toBe(true);
    expect(isCorrect(multi, [multi.answer[0]])).toBe(false);
    expect(isCorrect(multi, [...multi.answer, 99])).toBe(false);
  });

  it('builds a 60 question exam with unique questions', () => {
    const qs = pickExamQuestions(QUESTIONS, seeded(7));
    expect(qs).toHaveLength(EXAM_QUESTIONS);
    expect(new Set(qs.map((q) => q.id)).size).toBe(EXAM_QUESTIONS);
  });

  it('scores an exam and passes at 68%', () => {
    const s = newExamSession(QUESTIONS, 1000, seeded(3));
    expect(s.durationMs).toBe(EXAM_MINUTES * 60_000);
    // answer 41 correctly (68.3%), rest wrong/blank
    s.questionIds.forEach((id, i) => {
      const q = QUESTIONS.find((x) => x.id === id)!;
      if (i < 41) s.answers[id] = q.answer;
    });
    const r = scoreExam(s, QUESTIONS, 2000);
    expect(r.correct).toBe(41);
    expect(r.passed).toBe(true);
    expect(Object.values(r.byCategory).reduce((a, c) => a + c.total, 0)).toBe(60);

    delete s.answers[s.questionIds[0]];
    expect(scoreExam(s, QUESTIONS, 2000).passed).toBe(false); // 40/60 = 66.7%
  });

  it('formats clock', () => {
    expect(formatClock(105 * 60_000)).toBe('1:45:00');
    expect(formatClock(59_000)).toBe('00:59');
    expect(formatClock(-5)).toBe('00:00');
  });
});

describe('storage logic', () => {
  it('tracks failed questions and clears them when answered right', () => {
    const q = QUESTIONS[0];
    const wrongIdx = q.options.findIndex((_, i) => !q.answer.includes(i));
    let p = recordAnswer(emptyProgress(), q, [wrongIdx]);
    expect(failedIds(p)).toEqual([q.id]);
    p = recordAnswer(p, q, q.answer);
    expect(failedIds(p)).toEqual([]);
    expect(p.stats[q.id]).toMatchObject({ seen: 2, correct: 1, lastCorrect: true });
  });

  it('normalize rejects garbage', () => {
    expect(normalize(null)).toEqual(emptyProgress());
    expect(normalize('x')).toEqual(emptyProgress());
    expect(normalize({ exams: 5, stats: [] }).exams).toEqual([]);
  });
});
