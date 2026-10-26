import { useMemo, useState } from 'react';
import QuestionCard from '../components/QuestionCard';
import { QUESTIONS } from '../data';
import { CATEGORIES } from '../lib/categories';
import { isCorrect, makeOrder, shuffle } from '../lib/quiz';
import { failedIds, recordAnswer } from '../lib/storage';
import { useProgress } from '../store';
import type { CategoryId, Question } from '../types';

type Filter = 'all' | 'unseen' | 'failed';

interface Session {
  qs: Question[];
  orders: Record<string, number[]>;
  results: Record<string, boolean>;
}

export default function Practice({ preset }: { preset?: 'failed' }) {
  const { progress, update } = useProgress();
  const [cats, setCats] = useState<CategoryId[]>(CATEGORIES.map((c) => c.id));
  const [filter, setFilter] = useState<Filter>(preset ?? 'all');
  const [count, setCount] = useState(20);
  const [session, setSession] = useState<Session | null>(null);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const failedSet = useMemo(() => new Set(failedIds(progress)), [progress]);

  const pool = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (!cats.includes(q.category)) return false;
      if (filter === 'unseen') return !progress.stats[q.id];
      if (filter === 'failed') return failedSet.has(q.id);
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cats, filter, failedSet, progress.stats]);

  const start = () => {
    const qs = shuffle(pool).slice(0, count || pool.length);
    setSession({ qs, orders: Object.fromEntries(qs.map((q) => [q.id, makeOrder(q)])), results: {} });
    setIdx(0);
    setSelected([]);
    setRevealed(false);
  };

  const toggleCat = (id: CategoryId) => setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  if (!session) {
    return (
      <section className="card">
        <h1>{preset === 'failed' ? 'Repaso de falladas' : 'Modo práctica'}</h1>
        <p className="muted">
          {preset === 'failed'
            ? 'Preguntas cuya última respuesta fue incorrecta. Al acertarlas dejan de aparecer aquí.'
            : 'Feedback inmediato con explicación tras cada pregunta.'}
        </p>

        <h2>Temas</h2>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <label key={c.id} className={`chip-toggle ${cats.includes(c.id) ? 'on' : ''}`}>
              <input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggleCat(c.id)} />
              {c.name}
            </label>
          ))}
        </div>

        {!preset && (
          <>
            <h2>Preguntas</h2>
            <div className="chips">
              {([['all', 'Todas'], ['unseen', 'Sin ver'], ['failed', 'Falladas']] as [Filter, string][]).map(([v, l]) => (
                <label key={v} className={`chip-toggle ${filter === v ? 'on' : ''}`}>
                  <input type="radio" name="filter" checked={filter === v} onChange={() => setFilter(v)} />
                  {l}
                </label>
              ))}
            </div>
          </>
        )}

        <h2>Cantidad</h2>
        <div className="chips">
          {[10, 20, 40, 0].map((n) => (
            <label key={n} className={`chip-toggle ${count === n ? 'on' : ''}`}>
              <input type="radio" name="count" checked={count === n} onChange={() => setCount(n)} />
              {n === 0 ? 'Todas' : n}
            </label>
          ))}
        </div>

        <div className="actions">
          <button className="btn primary" disabled={pool.length === 0} onClick={start}>
            Empezar ({Math.min(count || pool.length, pool.length)} de {pool.length} disponibles)
          </button>
        </div>
        {pool.length === 0 && <p className="muted">No hay preguntas con esos filtros.</p>}
      </section>
    );
  }

  const done = idx >= session.qs.length;
  if (done) {
    const total = session.qs.length;
    const ok = Object.values(session.results).filter(Boolean).length;
    const wrong = session.qs.filter((q) => session.results[q.id] === false);
    return (
      <section className="card">
        <h1>Sesión terminada</h1>
        <p className="big-score">{ok} / {total} <span className="muted">({total ? Math.round((ok / total) * 100) : 0}%)</span></p>
        {wrong.length > 0 && (
          <>
            <h2>A repasar</h2>
            <ul className="plain">
              {wrong.map((q) => (
                <li key={q.id} className="wrong-item" lang="en">{q.q}</li>
              ))}
            </ul>
          </>
        )}
        <div className="actions">
          <button className="btn primary" onClick={() => setSession(null)}>Nueva sesión</button>
          <a className="btn" href="#/stats">Ver estadísticas</a>
        </div>
      </section>
    );
  }

  const q = session.qs[idx];
  const check = () => {
    const ok = isCorrect(q, selected);
    update((p) => recordAnswer(p, q, selected));
    setSession({ ...session, results: { ...session.results, [q.id]: ok } });
    setRevealed(true);
  };
  const next = () => {
    setIdx(idx + 1);
    setSelected([]);
    setRevealed(false);
  };

  return (
    <>
      <div className="progress-head">
        <span>Pregunta {idx + 1} / {session.qs.length}</span>
        <button className="btn small" onClick={() => setSession(null)}>Salir</button>
      </div>
      <QuestionCard q={q} order={session.orders[q.id]} selected={selected} onChange={setSelected} reveal={revealed} />
      <div className="actions sticky">
        {!revealed ? (
          <button className="btn primary" disabled={selected.length === 0} onClick={check}>Comprobar</button>
        ) : (
          <button className="btn primary" onClick={next}>{idx + 1 === session.qs.length ? 'Finalizar' : 'Siguiente →'}</button>
        )}
      </div>
    </>
  );
}
