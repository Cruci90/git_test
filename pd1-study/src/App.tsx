import { useHash } from './lib/useHash';
import Home from './views/Home';
import Practice from './views/Practice';
import Exam from './views/Exam';
import Stats from './views/Stats';

const LINKS = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/practice', label: 'Práctica', icon: '✏️' },
  { to: '/exam', label: 'Examen', icon: '⏱️' },
  { to: '/review', label: 'Falladas', icon: '🔁' },
  { to: '/stats', label: 'Estadísticas', icon: '📊' }
];

export default function App() {
  const hash = useHash();
  const [, section = '', param = ''] = hash.split('/');
  const route = '/' + section;

  let view;
  switch (route) {
    case '/practice':
      view = <Practice key="practice" />;
      break;
    case '/review':
      view = <Practice key="review" preset="failed" />;
      break;
    case '/exam':
      view = <Exam resultId={param || undefined} />;
      break;
    case '/stats':
      view = <Stats />;
      break;
    default:
      view = <Home />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="logo">PD1</span> Study
        </a>
        <nav className="nav" aria-label="Principal">
          {LINKS.map((l) => (
            <a key={l.to} href={`#${l.to}`} className={route === l.to ? 'active' : ''} aria-current={route === l.to ? 'page' : undefined}>
              <span aria-hidden="true">{l.icon}</span>
              <span className="label">{l.label}</span>
            </a>
          ))}
        </nav>
      </header>
      <main className="content">{view}</main>
    </div>
  );
}
