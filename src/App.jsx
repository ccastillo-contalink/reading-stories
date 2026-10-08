import React, { useEffect, useId, useRef, useState } from 'react';
import { choicesForStep, reorderAfterMistake } from './logic.mjs';

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
    <div className="print-note"><BookIcon/><p><strong>También puedes leer en papel.</strong><br/>Descarga los 40 cuentos con dibujos para recortar.</p><a href={`${base}documents/40-cuentos-recortables.pdf`} download="Bluey_40_cuentos_recortables.pdf">Descargar PDF <span aria-hidden="true">↓</span></a></div>
  </main>;
}

function ReadingStep({ story, stepIndex, onNext }) {
  const [choices, setChoices] = useState(() => choicesForStep(stepIndex, story.steps.length));
  const [status, setStatus] = useState('ready');
  const [attempts, setAttempts] = useState(0);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  function choose(scene) {
    if (status === 'correct') return;
    if (scene === stepIndex) { setStatus('correct'); return; }
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

function QuestionStep({ story, questionIndex, onNext }) {
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
      {item.options.map((option, index) => <button key={index} data-answer={index} disabled={correct} className={`answer-option ${selected === index ? correct ? 'selected-correct' : 'selected-wrong' : ''}`} onClick={() => setSelected(index)}>
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

export default function App() {
  const [stories, setStories] = useState(null);
  const [error, setError] = useState(false);
  const [story, setStory] = useState(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('catalog');
  const [completed, setCompleted] = useState(new Set());
  const [lastFinished, setLastFinished] = useState('');
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
      setCompleted(previous => new Set([...previous, story.id]));
      setLastFinished(story.title);
      setPhase('finished');
    }
  }
  const inStory = story && (phase === 'reading' || phase === 'quiz');
  return <>
    <a className="skip-link" href="#main">Saltar al contenido</a>
    <header className="site-header"><div className="header-inner page-width">
      <button className="brand" onClick={returnToCatalog} aria-label="Cuentos con Bluey, volver al inicio"><span className="brand-icon"><BookIcon/></span><span>Cuentos con <strong>Bluey</strong></span></button>
      <a className="pdf-link" href={`${base}documents/40-cuentos-recortables.pdf`} download="Bluey_40_cuentos_recortables.pdf"><span aria-hidden="true">↓</span> <span>Cuaderno PDF</span></a>
    </div></header>
    {!stories && <main className="loading page-width" id="main" role="status"><h1>{error ? 'No pudimos abrir los cuentos.' : 'Preparando tus cuentos…'}</h1>{error && <button className="primary-button" onClick={() => window.location.reload()}>Volver a intentar</button>}</main>}
    {stories && phase === 'catalog' && <Catalog stories={stories} completed={completed} lastFinished={lastFinished} onSelect={openStory}/>}
    {inStory && <main className="reader page-width" id="main">
      <div className="reader-nav"><button className="back-button" onClick={returnToCatalog}><Arrow back/> Todos los cuentos</button><span className="story-small-number">CUENTO {String(story.id).padStart(2, '0')}</span></div>
      <div className="reader-heading"><h1>{story.title}</h1><span className="progress-label">{phase === 'reading' ? `Oración ${step + 1} de 7` : `Pregunta ${step + 1} de 3`}</span></div>
      <div className="progress-track" role="progressbar" aria-label={phase === 'reading' ? 'Avance de lectura' : 'Avance de preguntas'} aria-valuemin={0} aria-valuemax={phase === 'reading' ? 7 : 3} aria-valuenow={step + 1}>
        {Array.from({ length: phase === 'reading' ? 7 : 3 }, (_, i) => <span key={i} className={i <= step ? 'filled' : ''}/>)}
      </div>
      {phase === 'reading' ? <ReadingStep key={`reading-${story.id}-${step}`} story={story} stepIndex={step} onNext={next}/> : <QuestionStep key={`quiz-${story.id}-${step}`} story={story} questionIndex={step} onNext={next}/>}
    </main>}
    {phase === 'finished' && <Finished title={story.title} onReturn={returnToCatalog}/>}
    <footer className="site-footer page-width"><span>Una oración a la vez, una aventura completa.</span><span>Actividad educativa no oficial · Personajes de Bluey</span></footer>
  </>;
}
