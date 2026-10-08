import React, { useEffect, useId, useRef, useState } from 'react';
import { choicesForStep, reorderAfterMistake, readingReward } from './logic.mjs';
import { useReadingSession } from './useReadingSession.js';
import { accuracyPercent, formatReadingTime } from './progress.mjs';

const base = import.meta.env.BASE_URL;
const letters = ['A', 'B', 'C'];

function BookIcon() {
  return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M14 7C10 4 5 5 3 6v16c3-2 7-2 11 0 4-2 8-2 11 0V6c-2-1-7-2-11 1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M14 7v15" stroke="currentColor" strokeWidth="2"/></svg>;
}
function Arrow({ back = false }) {
  return <span aria-hidden="true">{back ? '←' : '→'}</span>;
}

function Illustration({ story, scene = 0, lazy = false, label = '' }) {
  const unique = useId().replace(/:/g, '');
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazy);
  useEffect(() => {
    if (visible) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '250px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);
  const step = story.steps[scene];
  return <div className="illustration" ref={ref}>
    {visible && <svg viewBox={step.viewBox.join(' ')} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      <defs><clipPath id={unique}><polygon points={step.clip}/></clipPath></defs>
      <image href={`${base}${lazy ? story.preview : story.image}`} width={story.imageWidth} height={story.imageHeight} clipPath={`url(#${unique})`}/>
    </svg>}
  </div>;
}

function Catalog({ stories, completed, lastFinished, onSelect }) {
  return <main className="catalog page-width" id="main">
    {lastFinished && <div className="completion-banner" role="status"><span aria-hidden="true">✓</span> ¡Terminaste «{lastFinished}»! Elige tu próxima aventura.</div>}
    <div className="catalog-heading">
      <div><p className="eyebrow">LEER · MIRAR · DESCUBRIR</p><h1>Elige un cuento<span className="heading-dot">.</span></h1><p className="intro">Lee con Bluey, encuentra el dibujo y sigue la historia.</p></div>
      <div className="collection-count"><strong>40</strong><span>pequeñas aventuras</span></div>
    </div>
    <div className="catalog-meta"><span><span className="tiny-dot"/> 7 oraciones en cada cuento</span><span>{completed.size} de 40 completados</span></div>
    <div className="story-grid">
      {stories.map(story => <button className={`story-card ${completed.has(story.id) ? 'is-complete' : ''}`} key={story.id} onClick={() => onSelect(story)} aria-label={`Leer cuento ${story.id}: ${story.title}`}>
        <div className="story-card-top"><span className="story-number">{String(story.id).padStart(2, '0')}</span>{completed.has(story.id) && <span className="done-tag">✓ Leído</span>}</div>
        <Illustration story={story} lazy/>
        <div className="story-card-bottom"><h2>{story.title}</h2><span className="card-arrow"><Arrow/></span></div>
        <p>Leer y jugar</p>
      </button>)}
    </div>

  </main>;
}

function ReadingStep({ story, stepIndex, onNext, onAnswer }) {
  const [choices, setChoices] = useState(() => choicesForStep(stepIndex, story.steps.length));
  const [status, setStatus] = useState('ready');
  const [attempts, setAttempts] = useState(0);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  function choose(scene) {
    if (status === 'correct') return;
    if (scene === stepIndex) { onAnswer(true); setStatus('correct'); return; }
    onAnswer(false);
    setChoices(old => reorderAfterMistake(old));
    setAttempts(old => old + 1);
    setStatus('retry');
  }
  return <section className="exercise" aria-label={`Paso ${stepIndex + 1} de 7`}>
    <div className="reading-paper">
      <div className="step-label"><span>{stepIndex + 1}</span> LEE LA ORACIÓN</div>
      <h2 ref={heading} tabIndex="-1">{story.steps[stepIndex].sentence}</h2>
    </div>
    <div className="exercise-prompt"><h3>¿Qué dibujo corresponde?</h3><span>Elige una imagen</span></div>
    <div className="picture-options">
      {choices.map((scene, position) => <button key={scene} data-scene={scene} className={`picture-option ${status === 'correct' && scene === stepIndex ? 'selected-correct' : ''}`} disabled={status === 'correct'} onClick={() => choose(scene)} aria-label={`Elegir imagen ${position + 1}`}>
        <span className="option-index" aria-hidden="true">{status === 'correct' && scene === stepIndex ? '✓' : position + 1}</span>
        <Illustration story={story} scene={scene}/>
      </button>)}
    </div>
    <div className={`feedback-row ${status}`}>
      <p role="status" aria-live="polite" key={`${status}-${attempts}`}>{status === 'correct' ? '¡Muy bien! Encontraste el dibujo.' : status === 'retry' ? 'Mira otra vez. Las imágenes cambiaron de lugar; la correcta sigue aquí.' : 'Tómate tu tiempo. Puedes volver a leer.'}</p>
      {status === 'correct' && <button className="primary-button" onClick={onNext}>{stepIndex === 6 ? 'Ir a las preguntas' : 'Siguiente oración'} <Arrow/></button>}
    </div>
  </section>;
}

function QuestionStep({ story, questionIndex, onNext, onAnswer }) {
  const item = story.questions[questionIndex];
  const [selected, setSelected] = useState(null);
  const correct = selected === item.correct;
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <section className="quiz" aria-label={`Pregunta ${questionIndex + 1} de 3`}>
    <p className="eyebrow">RECUERDA LA HISTORIA</p>
    <h2 ref={heading} tabIndex="-1">{item.question}</h2>
    <p className="quiz-instruction">Elige una respuesta.</p>
    <div className="answer-options">
      {item.options.map((option, index) => <button key={index} data-answer={index} disabled={correct} className={`answer-option ${selected === index ? correct ? 'selected-correct' : 'selected-wrong' : ''}`} onClick={() => { if (correct) return; onAnswer(index === item.correct); setSelected(index); }}>
        <span className="answer-letter">{letters[index]}</span><span>{option}</span>{selected === index && <span className="answer-mark" aria-hidden="true">{correct ? '✓' : '↻'}</span>}
      </button>)}
    </div>
    <div className={`feedback-row ${correct ? 'correct' : selected !== null ? 'retry' : ''}`}>
      <p role="status" aria-live="polite">{correct ? '¡Eso es! Recordaste muy bien.' : selected !== null ? 'Inténtalo de nuevo. Las respuestas siguen en el mismo lugar.' : 'Piensa en lo que pasó en el cuento.'}</p>
      {correct && <button className="primary-button" onClick={onNext}>{questionIndex === 2 ? 'Terminar cuento' : 'Siguiente pregunta'} <Arrow/></button>}
    </div>
  </section>;
}

function Finished({ title, onReturn }) {
  useEffect(() => { const timer = setTimeout(onReturn, 2200); return () => clearTimeout(timer); }, [onReturn]);
  return <main className="finished page-width" id="main"><div className="finished-check" aria-hidden="true">✓</div><p className="eyebrow">¡CUENTO COMPLETADO!</p><h1>¡Lo hiciste muy bien!</h1><p>Terminaste «{title}» y sus tres preguntas.</p><button className="primary-button" onClick={onReturn}>Elegir otro cuento <Arrow/></button><small>Volvemos a los cuentos en un momento…</small></main>;
}

function ReadingHistory({ history, stories }) {
  const completed = stories.filter(story => history.stories[story.id]?.completions > 0);
  const percent = stats => `${accuracyPercent(stats).toLocaleString('es', { maximumFractionDigits: 1 })}%`;
  return <section id="history-summary" aria-label="Historial de lectura">
    <p className="summary-intro">Tu progreso acumulado, guardado en este navegador.</p>
    <dl className="history-metrics">
      <div><dt>Cuentos completados</dt><dd data-history="completed">{completed.length}<small> de {stories.length}</small></dd></div>
      <div><dt>Porcentaje de aciertos</dt><dd data-history="accuracy">{percent(history.totals)}</dd></div>
      <div><dt>Respuestas correctas</dt><dd className="positive" data-history="correct">{history.totals.correct}</dd></div>
      <div><dt>Respuestas incorrectas</dt><dd className="negative" data-history="incorrect">{history.totals.incorrect}</dd></div>
      <div className="history-total-time"><dt>Tiempo total de lectura</dt><dd data-history="time">{formatReadingTime(history.totals.activeMs)}</dd></div>
    </dl>
    <p className="summary-note">Aciertos ÷ total de respuestas × 100. Se incluyen los intentos de todos los cuentos, aunque todavía no estén completos.</p>
    <h3 className="history-list-title">Tus cuentos completados</h3>
    {completed.length === 0 ? <p className="history-empty">Cuando termines un cuento y sus tres preguntas, aparecerá aquí.</p> : <ul className="history-list">
      {completed.map(story => {
        const entry = history.stories[story.id];
        return <li key={story.id} data-history-story={story.id}>
          <div className="history-story-heading"><strong>{story.title}</strong><span>✓ {entry.completions === 1 ? 'Completado' : `${entry.completions} lecturas`}</span></div>
          <p>{entry.correct} aciertos · {entry.incorrect} errores</p>
          <div className="history-story-details"><span>{percent(entry)} de aciertos</span><span>{formatReadingTime(entry.activeMs)}</span></div>
        </li>;
      })}
    </ul>}
  </section>;
}

function SessionSummary({ stats, history, stories, persistenceAvailable, onClose }) {
  const dialog = useRef(null);
  const [view, setView] = useState('session');
  const { readingMinutes, televisionMinutes } = readingReward(stats);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog className="summary-dialog" ref={dialog} aria-labelledby="summary-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="summary-top"><p className="eyebrow">TU PROGRESO DE LECTURA</p><button className="summary-close" onClick={onClose} aria-label="Cerrar resumen">×</button></div>
    <h2 id="summary-title">Tu resumen</h2>
    <div className="summary-tabs" role="group" aria-label="Vista del resumen">
      <button aria-pressed={view === 'session'} aria-controls="session-summary" onClick={() => setView('session')}>Esta sesión</button>
      <button aria-pressed={view === 'history'} aria-controls="history-summary" onClick={() => setView('history')}>Historial</button>
    </div>
    {!persistenceAvailable && <p className="storage-notice" role="status">El navegador no permite guardar el historial. Podrás seguir leyendo, pero estos datos se perderán al cerrar o recargar.</p>}
    {view === 'session' ? <section id="session-summary" aria-label="Premio de esta sesión">
      <p className="summary-intro">El premio empieza en cero cada vez que recargas la página. Tu historial se conserva.</p>
      <dl className="summary-stats">
        <div><dt>Puntos ganados por leer<small>Tiempo de esta sesión: {formatReadingTime(stats.activeMs)}</small></dt><dd data-stat="time">+{readingMinutes}</dd></div>
        <div><dt>Respuestas correctas<small>De esta sesión</small></dt><dd className="positive" data-stat="correct">+{stats.correct}</dd></div>
        <div><dt>Respuestas incorrectas<small>De esta sesión</small></dt><dd className="negative" data-stat="incorrect">−{stats.incorrect}</dd></div>
      </dl>
      <div className="television-reward"><p>TU PREMIO</p><strong data-stat="reward">{televisionMinutes} <span>minutos</span></strong><p>de pantalla en la televisión</p></div>
      <p className="summary-formula">{readingMinutes} + {stats.correct} − {stats.incorrect} = {readingMinutes + stats.correct - stats.incorrect < 0 ? `${readingMinutes + stats.correct - stats.incorrect} → 0` : televisionMinutes}</p>
      <p className="summary-note">Se cuentan minutos completos. El tiempo se pausa aquí, en el catálogo y al ocultar la página. El premio mínimo es cero.</p>
    </section> : <ReadingHistory history={history} stories={stories || []}/>}
    <button className="primary-button summary-return" onClick={onClose}>Seguir leyendo <Arrow/></button>
  </dialog>;
}

export default function App() {
  const [stories, setStories] = useState(null);
  const [error, setError] = useState(false);
  const [story, setStory] = useState(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('catalog');
  const [lastFinished, setLastFinished] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { stats, history, persistenceAvailable, recordAnswer, completeStory } = useReadingSession((phase === 'reading' || phase === 'quiz') && !summaryOpen, story?.id);
  const completed = new Set(Object.entries(history.stories).filter(([, entry]) => entry.completions > 0).map(([id]) => Number(id)));
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${base}data/stories.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Unable to load stories');
      return response.json();
    }).then(setStories).catch(e => { if (e.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = story && phase !== 'catalog' ? `${story.title} · Cuentos con Bluey` : 'Cuentos con Bluey · Leer y jugar';
  }, [phase, step, story]);
  function openStory(selected) { setStory(selected); setStep(0); setPhase('reading'); }
  function returnToCatalog() { setPhase('catalog'); setStory(null); }
  function next() {
    if (phase === 'reading') {
      if (step < 6) setStep(step + 1);
      else { setStep(0); setPhase('quiz'); }
    } else if (step < 2) setStep(step + 1);
    else {
      completeStory(story.id);
      setLastFinished(story.title);
      setPhase('finished');
    }
  }
  const inStory = story && (phase === 'reading' || phase === 'quiz');
  return <>
    <a className="skip-link" href="#main">Saltar al contenido</a>
    <header className="site-header"><div className="header-inner page-width">
      <button className="brand" onClick={returnToCatalog} aria-label="Cuentos con Bluey, volver al inicio"><span className="brand-icon"><BookIcon/></span><span>Cuentos con <strong>Bluey</strong></span></button>
      <div className="header-actions"><button className="summary-button" onClick={() => setSummaryOpen(true)}><span aria-hidden="true">☆</span> Resumen</button>
      </div>
    </div></header>
    {!stories && <main className="loading page-width" id="main" role="status"><h1>{error ? 'No pudimos abrir los cuentos.' : 'Preparando tus cuentos…'}</h1>{error && <button className="primary-button" onClick={() => window.location.reload()}>Volver a intentar</button>}</main>}
    {stories && phase === 'catalog' && <Catalog stories={stories} completed={completed} lastFinished={lastFinished} onSelect={openStory}/>}
    {inStory && <main className="reader page-width" id="main">
      <div className="reader-nav"><button className="back-button" onClick={returnToCatalog}><Arrow back/> Todos los cuentos</button><span className="story-small-number">CUENTO {String(story.id).padStart(2, '0')}</span></div>
      <div className="reader-heading"><h1>{story.title}</h1><span className="progress-label">{phase === 'reading' ? `Oración ${step + 1} de 7` : `Pregunta ${step + 1} de 3`}</span></div>
      <div className="progress-track" role="progressbar" aria-label={phase === 'reading' ? 'Avance de lectura' : 'Avance de preguntas'} aria-valuemin={0} aria-valuemax={phase === 'reading' ? 7 : 3} aria-valuenow={step + 1}>
        {Array.from({ length: phase === 'reading' ? 7 : 3 }, (_, i) => <span key={i} className={i <= step ? 'filled' : ''}/>)}
      </div>
      {phase === 'reading' ? <ReadingStep key={`reading-${story.id}-${step}`} story={story} stepIndex={step} onNext={next} onAnswer={recordAnswer}/> : <QuestionStep key={`quiz-${story.id}-${step}`} story={story} questionIndex={step} onNext={next} onAnswer={recordAnswer}/>}
    </main>}
    {phase === 'finished' && <Finished title={story.title} onReturn={returnToCatalog}/>}
    {summaryOpen && <SessionSummary stats={stats} history={history} stories={stories} persistenceAvailable={persistenceAvailable} onClose={() => setSummaryOpen(false)}/>}
    <footer className="site-footer page-width"><span>Una oración a la vez, una aventura completa.</span><span>Actividad educativa no oficial · Personajes de Bluey</span></footer>
  </>;
}
