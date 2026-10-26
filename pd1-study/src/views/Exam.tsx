import { useEffect, useMemo, useRef, useState } from 'react';
import QuestionCard from '../components/QuestionCard';
import Bar from '../components/Bar';
import { QUESTIONS, QUESTION_BY_ID } from '../data';
import { CATEGORIES } from '../lib/categories';
import { EXAM_MINUTES, EXAM_QUESTIONS, PASS_PCT, formatClock, newExamSession, scoreExam } from '../lib/quiz';
import { recordAnswer } from '../lib/storage';
import { useProgress } from '../store';
import type { ExamResult, ExamSession } from '../types';

export default function Exam({ resultId }: { resultId?: string }) {
  const { progress } = useProgress();
  if (resultId) {
    const r = progress.exams.find((e) => e.id === resultId);
    return r ? <ResultView result={r} /> : <p className="card">Resultado no encontrado. <a href="#/exam">Volver</a></p>;
  }
  if (progress.activeExam) return <Running session={progress.activeExam} />;
  return <Start />;
}

function Start() {
  const { progress, update } = useProgress();
  const last = progress.exams.slice(-5).reverse();
  return (
    <>
      <section className="card">
        <h1>Simulacro de examen</h1>
        <ul className="plain info">
          <li>📝 {EXAM_QUESTIONS} preguntas (distribución según los pesos oficiales)</li>
          <li>⏱️ {EXAM_MINUTES} minutos — el reloj sigue corriendo aunque cierres la app</li>
          <li>🎯 Aprobado con {PASS_PCT}% ({Math.ceil((PASS_PCT / 100) * EXAM_QUESTIONS)} aciertos)</li>
          <li>🚫 Sin feedback hasta el final; puedes marcar preguntas para revisar</li>
        </ul>
        <div className="actions">
          <button
            className="btn primary"
            onClick={() => update((p) => ({ ...p, activeExam: newExamSession(QUESTIONS) }))}
          >
            Comenzar examen
          </button>
        </div>
      </section>
      {last.length > 0 && (
        <section className="card">
          <h2>Últimos intentos</h2>
          <ul className="plain">
            {last.map((e) => (
              <li key={e.id} className="row">
                <span className={`badge ${e.passed ? 'ok' : 'ko'}`}>{e.passed ? 'APROBADO' : 'SUSPENSO'}</span>
                <span className="grow">{new Date(e.date).toLocaleString()}</span>
                <a href={`#/exam/${e.id}`}>{e.pct}% →</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Running({ session }: { session: ExamSession }) {
  const { update } = useProgress();
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [confirming, setConfirming] = useState(false);
  const finished = useRef(false);

  const remaining = session.startedAt + session.durationMs - now;

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const result = scoreExam(session, QUESTIONS);
    update((p) => {
      let next = p;
      for (const it of result.items) {
        const q = QUESTION_BY_ID.get(it.id);
        if (q) next = recordAnswer(next, q, it.selected, result.date);
      }
      return { ...next, exams: [...next.exams, result], activeExam: null };
    });
    window.location.hash = `#/exam/${result.id}`;
  };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining <= 0]);

  const q = QUESTION_BY_ID.get(session.questionIds[idx])!;
  const selected = session.answers[q.id] ?? [];
  const setSel = (sel: number[]) =>
    update((p) =>
      p.activeExam ? { ...p, activeExam: { ...p.activeExam, answers: { ...p.activeExam.answers, [q.id]: sel } } } : p
    );
  const flagged = session.flagged.includes(q.id);
  const toggleFlag = () =>
    update((p) =>
      p.activeExam
        ? {
            ...p,
            activeExam: {
              ...p.activeExam,
              flagged: flagged ? p.activeExam.flagged.filter((i) => i !== q.id) : [...p.activeExam.flagged, q.id]
            }
          }
        : p
    );

  const answered = session.questionIds.filter((id) => (session.answers[id] ?? []).length > 0).length;
  const unanswered = session.questionIds.length - answered;

  return (
    <>
      <div className="exam-head card">
        <span className={`timer ${remaining < 5 * 60_000 ? 'low' : ''}`} aria-live="off" aria-label="Tiempo restante">
          ⏱ {formatClock(remaining)}
        </span>
        <span>{answered}/{session.questionIds.length} respondidas</span>
        <button className="btn small danger" onClick={() => setConfirming(true)}>Finalizar</button>
      </div>

      <QuestionCard
        q={q}
        order={session.orders[q.id]}
        selected={selected}
        onChange={setSel}
        heading={`Pregunta ${idx + 1} / ${session.questionIds.length}`}
      />

      <div className="actions sticky">
        <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Anterior</button>
        <button className={`btn ${flagged ? 'flag-on' : ''}`} onClick={toggleFlag}>🚩 {flagged ? 'Marcada' : 'Marcar'}</button>
        <button className="btn primary" disabled={idx === session.questionIds.length - 1} onClick={() => setIdx(idx + 1)}>Siguiente →</button>
      </div>

      <nav className="card qgrid" aria-label="Navegación de preguntas">
        {session.questionIds.map((id, i) => {
          const done = (session.answers[id] ?? []).length > 0;
          const fl = session.flagged.includes(id);
          return (
            <button
              key={id}
              className={`qdot ${done ? 'done' : ''} ${fl ? 'flag' : ''} ${i === idx ? 'cur' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Ir a pregunta ${i + 1}${done ? ', respondida' : ''}${fl ? ', marcada' : ''}`}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      {confirming && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="fin-title">
          <div className="card">
            <h2 id="fin-title">¿Finalizar el examen?</h2>
            <p>
              {unanswered > 0 ? `Tienes ${unanswered} pregunta(s) sin responder. ` : ''}
              {session.flagged.length > 0 ? `${session.flagged.length} marcada(s) para revisar. ` : ''}
              Esta acción no se puede deshacer.
            </p>
            <div className="actions">
              <button className="btn" onClick={() => setConfirming(false)}>Seguir</button>
              <button className="btn danger" onClick={finish}>Finalizar y ver resultado</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ResultView({ result }: { result: ExamResult }) {
  const [onlyWrong, setOnlyWrong] = useState(true);
  const items = useMemo(() => result.items.filter((i) => (onlyWrong ? !i.ok : true)), [result, onlyWrong]);
  const mins = Math.round(result.usedMs / 60000);

  return (
    <>
      <section className="card result">
        <span className={`badge big ${result.passed ? 'ok' : 'ko'}`}>{result.passed ? 'APROBADO' : 'SUSPENSO'}</span>
        <p className="big-score">{result.pct}%</p>
        <p className="muted">
          {result.correct} / {result.total} correctas · {mins} min · mínimo {PASS_PCT}%
        </p>
        <h2>Por tema</h2>
        <ul className="plain">
          {CATEGORIES.map((c) => {
            const r = result.byCategory[c.id];
            const pct = r.total ? (r.correct / r.total) * 100 : 0;
            return (
              <li key={c.id} className="cat-row">
                <div className="row">
                  <span className="grow">{c.name}</span>
                  <span>{r.correct}/{r.total} ({Math.round(pct)}%)</span>
                </div>
                <Bar pct={pct} color={c.color} />
              </li>
            );
          })}
        </ul>
        <div className="actions">
          <a className="btn primary" href="#/exam">Nuevo examen</a>
          <a className="btn" href="#/review">Repasar falladas</a>
        </div>
      </section>

      <div className="progress-head">
        <h2>Revisión</h2>
        <label className="switch">
          <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} /> Solo falladas
        </label>
      </div>
      {items.length === 0 && <p className="card">¡Sin errores que mostrar! 🎉</p>}
      {items.map((it) => {
        const q = QUESTION_BY_ID.get(it.id);
        if (!q) return null;
        return <QuestionCard key={it.id} q={q} order={result.orders[it.id] ?? q.options.map((_, i) => i)} selected={it.selected} reveal />;
      })}
    </>
  );
}
