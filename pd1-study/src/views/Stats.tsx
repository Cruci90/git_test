import { useRef, useState } from 'react';
import Bar from '../components/Bar';
import { QUESTIONS } from '../data';
import { CATEGORIES } from '../lib/categories';
import { PASS_PCT } from '../lib/quiz';
import { emptyProgress, failedIds, normalize } from '../lib/storage';
import { useProgress } from '../store';

export default function Stats() {
  const { progress, replace } = useProgress();
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = CATEGORIES.map((c) => {
    const qs = QUESTIONS.filter((q) => q.category === c.id);
    let seen = 0, attempts = 0, correct = 0, failed = 0;
    for (const q of qs) {
      const s = progress.stats[q.id];
      if (!s) continue;
      seen++;
      attempts += s.seen;
      correct += s.correct;
      if (!s.lastCorrect) failed++;
    }
    return { c, total: qs.length, seen, attempts, correct, failed, pct: attempts ? (correct / attempts) * 100 : 0 };
  });
  const totalAttempts = rows.reduce((s, r) => s + r.attempts, 0);
  const totalCorrect = rows.reduce((s, r) => s + r.correct, 0);
  const weakest = rows.filter((r) => r.attempts > 0).sort((a, b) => a.pct - b.pct)[0];

  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pd1-study-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (file?: File) => {
    if (!file) return;
    try {
      replace(normalize(JSON.parse(await file.text())));
      setMsg('Progreso importado.');
    } catch {
      setMsg('Archivo no válido.');
    }
  };

  return (
    <>
      <section className="card">
        <h1>Estadísticas</h1>
        <div className="grid stats-tiles">
          <div className="tile"><span className="tile-num">{totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0}%</span><span className="tile-label">acierto global</span></div>
          <div className="tile"><span className="tile-num">{totalAttempts}</span><span className="tile-label">respuestas</span></div>
          <div className="tile"><span className="tile-num">{failedIds(progress).length}</span><span className="tile-label">falladas</span></div>
        </div>
        {weakest && <p>💡 Tema más débil: <strong>{weakest.c.name}</strong> ({Math.round(weakest.pct)}%)</p>}
      </section>

      <section className="card">
        <h2>Por tema</h2>
        <ul className="plain">
          {rows.map((r) => (
            <li key={r.c.id} className="cat-row">
              <div className="row">
                <span className="grow">{r.c.name}</span>
                <span>{r.attempts ? `${Math.round(r.pct)}%` : '—'}</span>
              </div>
              <Bar pct={r.pct} color={r.c.color} label={`${r.c.name}: ${Math.round(r.pct)}%`} />
              <span className="muted small">{r.seen}/{r.total} vistas · {r.failed} falladas · {r.attempts} respuestas</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Historial de exámenes</h2>
        {progress.exams.length === 0 ? (
          <p className="muted">Aún no has hecho ningún simulacro.</p>
        ) : (
          <>
            <div className="spark" aria-hidden="true">
              {progress.exams.slice(-20).map((e) => (
                <div key={e.id} className={`spark-bar ${e.passed ? 'ok' : 'ko'}`} style={{ height: `${Math.max(4, e.pct)}%` }} title={`${e.pct}%`} />
              ))}
              <div className="spark-line" style={{ bottom: `${PASS_PCT}%` }} />
            </div>
            <ul className="plain">
              {progress.exams.slice().reverse().map((e) => (
                <li key={e.id} className="row">
                  <span className={`badge ${e.passed ? 'ok' : 'ko'}`}>{e.passed ? 'OK' : 'KO'}</span>
                  <span className="grow">{new Date(e.date).toLocaleString()}</span>
                  <a href={`#/exam/${e.id}`}>{e.pct}% →</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2>Datos</h2>
        <p className="muted">Todo se guarda solo en este navegador (localStorage). Exporta una copia para cambiar de dispositivo.</p>
        <div className="actions">
          <button className="btn" onClick={exportData}>⬇ Exportar</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆ Importar</button>
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm('¿Borrar todo el progreso? No se puede deshacer.')) {
                replace(emptyProgress());
                setMsg('Progreso borrado.');
              }
            }}
          >
            Borrar progreso
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </div>
        {msg && <p role="status">{msg}</p>}
      </section>
    </>
  );
}
