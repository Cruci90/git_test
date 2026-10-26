import type { CategoryId, Question } from '../types';

/** Compact question factory. `answer` is a single index or an array (choose-N questions). */
export function makeFactory(category: CategoryId, prefix: string) {
  let n = 0;
  return (q: string, options: string[], answer: number | number[], exp: string, code?: string): Question => {
    n++;
    return {
      id: `${prefix}-${String(n).padStart(2, '0')}`,
      category,
      q,
      code,
      options,
      answer: Array.isArray(answer) ? answer : [answer],
      exp
    };
  };
}
