import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { TERM_LESSONS, TERMS, type Term } from './data/terms';
import { TermArt } from './components/TermArt';
import { useTermMemory } from './state/useTermMemory';
import { hapticNotify, setBackButtonVisible } from './telegram';
import './workshop.css';

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function Icon({ type }: { type: 'arrow' | 'repeat' | 'lock' | 'close' | 'check' }) {
  const paths = { arrow: 'M4 12h16m-6-6 6 6-6 6', repeat: 'M4 10a8 8 0 1 1 1 8M4 4v6h6', lock: 'M7 10V7a5 5 0 0 1 10 0v3M6 10h12v11H6zM12 14v3', close: 'm6 6 12 12M6 18 18 6', check: 'm5 12 4 4L19 6' };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>;
}

export default function WorkshopApp() {
  const { memory, answer, sync } = useTermMemory();
  const [session, setSession] = useState<{ terms: Term[]; options: string[][]; title: string } | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Term[]>([]);
  const [finished, setFinished] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const guard = useRef(false);
  const scroll = useRef<HTMLDivElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const learned = TERMS.filter(t => memory[t.id]);
  const due = learned.filter(t => memory[t.id].due <= now);
  const next = TERM_LESSONS.findIndex(l => l.terms.some(t => !memory[t.id]));
  const completed = TERM_LESSONS.filter(l => l.terms.every(t => memory[t.id])).length;
  const activeIndex = selected ?? (next < 0 ? TERM_LESSONS.length - 1 : next);
  const lesson = TERM_LESSONS[activeIndex];
  const term = session?.terms[index];
  const nextDue = learned.length ? Math.min(...learned.map(t => memory[t.id].due)) : null;

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    setBackButtonVisible(!!session, () => finished ? home() : openExit());
    return () => setBackButtonVisible(false, () => {});
  }, [session, finished]);
  useEffect(() => {
    if (chosen) feedback.current?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [chosen]);
  function home() { setSession(null); setSelected(null); setExitOpen(false); setNow(Date.now()); }
  function openExit() { focusReturn.current = document.activeElement as HTMLElement; setExitOpen(true); }
  function closeExit() { setExitOpen(false); focusReturn.current?.focus(); }
  function trap(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') closeExit();
    if (event.key !== 'Tab') return;
    const buttons = event.currentTarget.querySelectorAll('button');
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function start(terms: Term[], title: string) {
    if (!terms.length) return;
    setSession({ terms, title, options: terms.map(t => shuffled(TERM_LESSONS.find(l => l.terms.some(a => a.id === t.id))!.terms.map(a => a.definition))) });
    setIndex(0); setChosen(null); setScore(0); setMistakes([]); setFinished(false); guard.current = false;
  }
  function startLesson() {
    const unseen = lesson.terms.filter(t => !memory[t.id]);
    start(unseen.length ? unseen : lesson.terms, lesson.title);
  }
  function choose(option: string) {
    if (!term || guard.current) return;
    guard.current = true;
    const correct = option === term.definition;
    setChosen(option); answer(term.id, correct); hapticNotify(correct ? 'success' : 'error');
    if (correct) setScore(s => s + 1); else setMistakes(m => [...m, term]);
  }
  function advance() {
    if (!session || chosen === null) return;
    if (index + 1 === session.terms.length) setFinished(true);
    else { setIndex(i => i + 1); setChosen(null); guard.current = false; }
    scroll.current?.scrollTo({ top: 0 });
  }

  return <div className="workshop-stage"><div className={`workshop-app ${session ? 'in-session' : ''}`}>
    <header className="workshop-header">
      <div className="workshop-logo"><span className="logo-hex">К</span><span>КОНТУР<small>ТРЕНАЖЁР ЧПУ</small></span></div>
      <span className="hardware-tag"><i />FANUC · ТОКАРНЫЙ</span>
    </header>
    {!session ? <>
      <div className="workshop-scroll" ref={scroll}>
        <section className="chapter-heading"><div><span className="overline">МОДУЛЬ 01 / ОСНОВЫ</span><h1>Понимать станок.</h1><p>От первого термина к уверенному действию.</p></div><div className="chapter-progress" aria-label={`${completed} из 6 уроков`}><strong>{completed}<small>/6</small></strong><span>УРОКОВ</span></div></section>
        <section className="specimen" aria-label="Иллюстрация выбранного урока">
          <div className="specimen-grid"/><div className="specimen-ring ring-back"/><div className="specimen-ring ring-front"/>
          <div className="specimen-model" key={activeIndex}><TermArt kind={lesson.terms[0].picture}/></div>
          <span className="specimen-caption">ОБЪЕКТ {String(activeIndex + 1).padStart(2,'0')}<b>{lesson.terms[0].name}</b></span><span className="specimen-scale">X ─── Z</span>
          <div className="specimen-light"/>
        </section>
        <div className="route-heading"><span>МАРШРУТ ОБУЧЕНИЯ</span><span>{learned.length} / {TERMS.length} терминов</span></div>
        <section className="workshop-route" aria-label="Путь обучения">
          {TERM_LESSONS.map((l, i) => {
            const done = l.terms.every(t => memory[t.id]);
            const locked = next >= 0 && i > next;
            const active = i === activeIndex;
            return <button type="button" key={l.title} disabled={locked} aria-pressed={active} className={`route-step ${done?'step-done':''} ${active?'step-active':''}`} onClick={() => setSelected(i)}>
              <span className="route-badge">{done ? <Icon type="check"/> : String(i+1).padStart(2,'0')}</span>
              <span className="route-copy"><span>{active ? 'ВЫБРАННЫЙ УРОК' : done ? 'ПРОЙДЕНО' : `УРОК ${i+1}`}</span><strong>{l.title}</strong><small>{l.subtitle}</small></span>
              <span className="route-end">{locked ? <Icon type="lock"/> : <span className="route-dots">{l.terms.map(t=><i key={t.id} className={memory[t.id]?'lit':''}/>)}</span>}</span>
            </button>;
          })}
          <p className="course-note">Первый модуль: 24 понятия о станке и обработке.</p>
        </section>
      </div>
      <div className="workshop-dock">
        <div className="dock-description"><span>Урок {activeIndex+1} · 4 термина</span><span>≈ 2 минуты</span></div>
        <button type="button" className="workshop-primary" onClick={startLesson}>{lesson.terms.every(t=>memory[t.id])?'Пройти ещё раз':learned.length?'Продолжить урок':'Начать обучение'}<Icon type="arrow"/></button>
        <button type="button" className="workshop-review" disabled={!learned.length} onClick={()=>start(due.length?due:learned,'Повторение пройденного')}><Icon type="repeat"/><span>Повторить пройденное</span>{due.length>0&&<b>{due.length}</b>}</button>
        <span className="sync-message" role="status">{sync==='storage-error'?'Не удалось сохранить на устройстве — не закрывай приложение.':sync==='pending'?'Ответы на устройстве · ожидаем синхронизацию':nextDue?`Следующее повторение: ${new Date(nextDue).toLocaleDateString('ru-RU',{day:'numeric',month:'long'})}`:'Новые знания закрепим интервальными повторениями'}</span>
      </div>
    </> : finished ? <main className="workshop-result">
      <div className="result-emblem"><Icon type="check"/></div><span className="overline">ТРЕНИРОВКА ЗАВЕРШЕНА</span><h1>{mistakes.length?'Опыт получен.':'Точная работа.'}</h1><p>{mistakes.length?'Сложные понятия можно закрепить прямо сейчас.':'Ещё один шаг к пониманию станка.'}</p>
      <div className="result-score"><strong>{score}<span> / {session.terms.length}</span></strong><small>ПРАВИЛЬНЫХ ОТВЕТОВ</small></div>
      <div className="interval-card"><Icon type="repeat"/><div><strong>Знания останутся с тобой</strong><p>Повторения через 1, 3, 7 и 21 день.<br/>После ошибки начинаем с одного дня.</p></div></div>
      {mistakes.length>0&&<button className="workshop-primary" onClick={()=>start(mistakes,'Закрепление ошибок')}>Закрепить ошибки<Icon type="arrow"/></button>}
      <button className={mistakes.length?'workshop-secondary':'workshop-primary'} onClick={home}>На маршрут<Icon type="arrow"/></button>
    </main> : term && <>
      <div className="exercise-bar"><button className="icon-button" onClick={openExit} aria-label="Закрыть урок"><Icon type="close"/></button><div className="exercise-progress" role="progressbar" aria-label="Прогресс урока" aria-valuemin={0} aria-valuemax={session.terms.length} aria-valuenow={index+(chosen?1:0)}>{session.terms.map((t,i)=><i key={t.id} className={i<index||i===index&&chosen?'lit':''}/>)}</div><span>{index+1}<small>/{session.terms.length}</small></span></div>
      <main className="exercise-scroll" ref={scroll}>
        <div className="exercise-content" key={term.id}><span className="overline">{session.title}</span><h1>{term.name}</h1>
          <div className="exercise-object"><div className="object-orbit"/><TermArt kind={term.picture}/><span>ВЫБЕРИ ЗНАЧЕНИЕ ТЕРМИНА</span></div>
          <div className="workshop-options">{session.options[index].map((option,i)=>{
            const correct=option===term.definition;
            return <button key={option} disabled={chosen!==null} onClick={()=>choose(option)} className={`workshop-option ${chosen!==null&&correct?'option-correct':''} ${chosen===option&&!correct?'option-wrong':''}`}><span>{chosen!==null&&correct?<Icon type="check"/>:chosen===option?<Icon type="close"/>:['А','Б','В','Г'][i]}</span><strong>{option}</strong></button>;
          })}</div>
          {chosen!==null&&<div ref={feedback} className={`workshop-feedback ${chosen===term.definition?'feedback-correct':''}`} role="status"><strong>{chosen===term.definition?'Верно. Именно так.':'Разберёмся вместе.'}</strong><p>{term.explanation}</p><button className="workshop-primary" onClick={advance}>{index+1===session.terms.length?'Завершить':'Следующий термин'}<Icon type="arrow"/></button></div>}
        </div>
      </main>
    </>}
    {exitOpen&&<div className="workshop-backdrop"><section className="workshop-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-title" onKeyDown={trap}><span className="overline">ПАУЗА</span><h2 id="exit-title">Прервём тренировку?</h2><p>Отвеченные термины сохранены. Урок продолжится с оставшихся.</p><button autoFocus className="workshop-primary" onClick={closeExit}>Продолжить урок</button><button className="workshop-secondary" onClick={home}>На маршрут</button></section></div>}
  </div></div>;
}
