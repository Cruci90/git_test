import type { CategoryId } from '../types';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  short: string;
  /** Official exam weight (%). */
  weight: number;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'fundamentals', name: 'Developer Fundamentals', short: 'Fundamentals', weight: 27, color: '#0b5cab' },
  { id: 'automation', name: 'Process Automation & Logic', short: 'Automation & Logic', weight: 28, color: '#7b3fb8' },
  { id: 'ui', name: 'User Interface', short: 'User Interface', weight: 25, color: '#0e8a6a' },
  { id: 'testing', name: 'Testing, Debugging & Deployment', short: 'Testing & Deploy', weight: 20, color: '#c2410c' }
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryInfo>;
