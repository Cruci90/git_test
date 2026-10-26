export type CategoryId = 'fundamentals' | 'automation' | 'ui' | 'testing';

export interface Question {
  id: string;
  category: CategoryId;
  /** Question text (English). */
  q: string;
  /** Optional code sample shown under the question. */
  code?: string;
  options: string[];
  /** Indexes into `options` of the correct answer(s). More than one => "choose N". */
  answer: number[];
  /** Explanation in Spanish. */
  exp: string;
}

export interface QuestionStat {
  seen: number;
  correct: number;
  lastCorrect: boolean;
  last: number;
}

export interface ExamSession {
  id: string;
  startedAt: number;
  durationMs: number;
  questionIds: string[];
  /** Display order of options per question (permutation of original indexes). */
  orders: Record<string, number[]>;
  /** Selected original option indexes per question. */
  answers: Record<string, number[]>;
  flagged: string[];
}

export interface ExamResult {
  id: string;
  date: number;
  total: number;
  correct: number;
  pct: number;
  passed: boolean;
  usedMs: number;
  byCategory: Record<CategoryId, { total: number; correct: number }>;
  items: { id: string; selected: number[]; ok: boolean }[];
  orders: Record<string, number[]>;
}

export interface Progress {
  version: 1;
  stats: Record<string, QuestionStat>;
  exams: ExamResult[];
  activeExam: ExamSession | null;
}
