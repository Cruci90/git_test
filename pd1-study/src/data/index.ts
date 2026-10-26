import type { Question } from '../types';
import { automation } from './automation';
import { fundamentals } from './fundamentals';
import { testing } from './testing';
import { ui } from './ui';

export const QUESTIONS: Question[] = [...fundamentals, ...automation, ...ui, ...testing];
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
