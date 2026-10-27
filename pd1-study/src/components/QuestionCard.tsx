import type React from 'react';
import type { Question } from '../types';
import { CATEGORY_BY_ID } from '../lib/categories';

interface Props {
  q: Question;
  order: number[];
  selected: number[];
  onChange?: (sel: number[]) => void;
  /** Show correct/incorrect marks and the explanation. */
  reveal?: boolean;
  heading?: string;
}

export default function QuestionCard({ q, order, selected, onChange, reveal = false, heading }: Props) {
  const multi = q.answer.length > 1;
  const cat = CATEGORY_BY_ID[q.category];

  const toggle = (idx: number) => {
    if (!onChange || reveal) return;
    if (multi) {
      onChange(selected.includes(idx) ? selected.filter((i) => i !== idx) : [...selected, idx]);
    } else {
      onChange([idx]);
    }
  };

  const ok = reveal && selected.length === q.answer.length && q.answer.every((a) => selected.includes(a));

  return (
    <article className="card question">
      <div className="q-meta">
        {heading && <span className="q-heading">{heading}</span>}
        <span className="chip" style={{ borderColor: cat.color, color: cat.color }}>
          {cat.short}
        </span>
        {multi && <span className="chip chip-multi">Choose {q.answer.length}</span>}
      </div>
      <p className="q-text" lang="en">
        {q.q}
      </p>
      {q.code && (
        <pre className="code" lang="en">
          <code>{q.code}</code>
        </pre>
      )}
      <ul className="options" role={multi ? 'group' : 'radiogroup'} aria-label="Options">
        {order.map((idx, pos) => {
          const isSel = selected.includes(idx);
          const isAns = q.answer.includes(idx);
          let cls = 'option';
          if (isSel) cls += ' selected';
          if (reveal && isAns) cls += ' correct';
          if (reveal && isSel && !isAns) cls += ' wrong';
          return (
            <li key={idx} style={{ '--k': pos } as React.CSSProperties}>
              <label className={cls}>
                <input
                  type={multi ? 'checkbox' : 'radio'}
                  name={`q-${q.id}`}
                  checked={isSel}
                  disabled={reveal}
                  onChange={() => toggle(idx)}
                />
                <span className="opt-letter">{String.fromCharCode(65 + pos)}</span>
                <span className="opt-text" lang="en">
                  {q.options[idx]}
                </span>
                {reveal && isAns && <span className="mark" aria-label="Correcta">✓</span>}
                {reveal && isSel && !isAns && <span className="mark" aria-label="Incorrecta">✗</span>}
              </label>
            </li>
          );
        })}
      </ul>
      {reveal && (
        <div className={`explain ${ok ? 'good' : 'bad'}`} role="status">
          <strong>{ok ? '¡Correcto!' : selected.length ? 'Incorrecto' : 'Sin responder'}</strong>
          <p lang="es">{q.exp}</p>
        </div>
      )}
    </article>
  );
}
