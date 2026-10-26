import { QUESTIONS } from '../data';
import { CATEGORIES } from '../lib/categories';
import { failedIds } from '../lib/storage';
import { EXAM_MINUTES, EXAM_QUESTIONS, PASS_PCT } from '../lib/quiz';
import { useProgress } from '../store';

export default function Home() {
  const { progress } = useProgress();
  const seen = Object.keys(progress.stats).length;
  const failed = failedIds(progress).length;
  const last = progress.exams[progress.exams.length - 1];

  return (
    <>
      <section className="hero card">
        <h1>Salesforce Platform Developer I</h1>
        <p>
          Banco de <strong>{QUESTIONS.length}</strong> preguntas originales en inglés con explicaciones en español. Practica por tema o
          simula el examen real: {EXAM_QUESTIONS} preguntas, {EXAM_MINUTES} minutos, aprobado con {PASS_PCT}%.
        </p>
        <div className="actions">
          {progress.activeExam ? (
            <a className="btn primary" href="#/exam">▶ Continuar examen en curso</a>
          ) : (
            <a className="btn primary" href="#/exam">⏱️ Simulacro de examen</a>
          )}
          <a className="btn" href="#/practice">✏️ Modo práctica</a>
          <a className="btn" href="#/review">🔁 Repasar falladas ({failed})</a>
        </div>
      </section>

      <section className="grid stats-tiles">
        <div className="card tile">
          <span className="tile-num">{seen}/{QUESTIONS.length}</span>
          <span className="tile-label">preguntas vistas</span>
        </div>
        <div className="card tile">
          <span className="tile-num">{failed}</span>
          <span className="tile-label">por repasar</span>
        </div>
        <div className="card tile">
          <span className="tile-num">{progress.exams.length}</span>
          <span className="tile-label">exámenes realizados</span>
        </div>
        <div className="card tile">
          <span className="tile-num">{last ? `${last.pct}%` : '—'}</span>
          <span className="tile-label">último examen</span>
        </div>
      </section>

      <section className="card">
        <h2>Temas del examen</h2>
        <ul className="plain">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="row">
              <span className="dot" style={{ background: c.color }} />
              <span className="grow">{c.name}</span>
              <span className="muted">{c.weight}% · {QUESTIONS.filter((q) => q.category === c.id).length} preguntas</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
