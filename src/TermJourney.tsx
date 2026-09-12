import { useEffect, useRef, useState } from 'react';
import { TERM_LESSONS, TERMS, type Term } from './data/terms';
import { TermArt } from './components/TermArt';
import { useTermMemory } from './state/useTermMemory';
import { hapticNotify, setBackButtonVisible } from './telegram';
import './journey.css';

interface Card { term: Term; options: string[]; }
function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
function makeCards(terms: Term[]): Card[] {
  return terms.map(term => ({ term, options: shuffled(TERM_LESSONS.find(l => l.terms.some(t => t.id === term.id))!.terms.map(t => t.definition)) }));
}
export default function TermJourney() {
  const { memory, answer, sync } = useTermMemory();
  const [session, setSession] = useState<{ cards: Card[]; title: string } | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [mistakes, setMistakes] = useState<Term[]>([]);
  const feedback = useRef<HTMLDivElement>(null);
  const answerGuard = useRef(false);
  const due = TERMS.filter(t => memory[t.id] && memory[t.id].due <= now);
  const learned = TERMS.filter(t => memory[t.id]);
  const completed = TERM_LESSONS.filter(l => l.terms.every(t => memory[t.id])).length;
  const nextLesson = TERM_LESSONS.findIndex(l => l.terms.some(t => !memory[t.id]));
  const nextDue = learned.length ? Math.min(...learned.map(t => memory[t.id].due)) : null;
  const card = session?.cards[index];
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    setBackButtonVisible(!!session, () => finished ? home() : setConfirmExit(true));
    return () => setBackButtonVisible(false, () => {});
  }, [session, finished]);
  useEffect(() => { if (chosen) feedback.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }); }, [chosen]);
  function home() { setSession(null); setConfirmExit(false); setNow(Date.now()); }
  function start(terms: Term[], title: string) {
    if (!terms.length) return;
    setSession({ cards: makeCards(terms), title }); setIndex(0); setChosen(null); setScore(0); setMistakes([]); setFinished(false); setConfirmExit(false); answerGuard.current = false; window.scrollTo(0, 0);
  }
  function startLesson(i: number) {
    const lesson = TERM_LESSONS[i];
    const unseen = lesson.terms.filter(t => !memory[t.id]);
    start(unseen.length ? unseen : lesson.terms, lesson.title);
  }
  function select(option: string) {
    if (!card || answerGuard.current) return;
    answerGuard.current = true;
    const correct = option === card.term.definition;
    setChosen(option); answer(card.term.id, correct); hapticNotify(correct ? 'success' : 'error');
    if (correct) setScore(s => s + 1); else setMistakes(m => [...m, card.term]);
  }
  function advance() {
    if (!session || chosen === null) return;
    if (index + 1 === session.cards.length) { setFinished(true); hapticNotify('success'); }
    else { setIndex(i => i + 1); setChosen(null); answerGuard.current = false; }
    window.scrollTo(0, 0);
  }
  return <div className="journey">
    <header className="brandbar"><button className="wordmark" onClick={() => session && !finished ? setConfirmExit(true) : home()} aria-label="На путь обучения"><span className="brand-symbol">c.</span><span>контур<span className="brand-dot">·</span></span></button><span className="brand-caption">маленькие шаги. большой навык.</span><span className="brand-sub">ЧПУ, понятно.</span></header>
    {!session ? <main className="journey-layout">
      <section className="intro-panel">
        <div className="eyebrow"><span className="status-dot"/>ОТ ПЕРВОГО ТЕРМИНА К ПОНИМАНИЮ</div>
        <h1>Сложное.<br/><span>Становится ясным.</span></h1>
        <p className="intro-copy">Один термин. Один рисунок.<br/>И ещё немного уверенности в себе.</p>
        <div className="hero-scene"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><TermArt kind="part" hero/><span className="floating-tag tag-top"><i/>форма начинается с идеи</span><span className="floating-tag tag-bottom">знакомимся с миром ЧПУ <span>↗</span></span><span className="scene-dot"/></div>
        <div className="continue-box"><div><span className="tiny-label">ТВОЙ СЛЕДУЮЩИЙ ШАГ</span><h2>{nextLesson < 0 ? 'Знания любят повторение' : TERM_LESSONS[nextLesson].title}</h2><p>{nextLesson < 0 ? 'Все уроки пройдены. Закрепим пройденное?' : `Урок ${nextLesson+1} · ${TERM_LESSONS[nextLesson].terms.filter(t=>!memory[t.id]).length} термина · около 2 минут`}</p></div><button className="primary" onClick={() => nextLesson < 0 ? start(due.length ? due : learned, 'Повторяем пройденное') : startLesson(nextLesson)}>{nextLesson < 0 ? 'Повторить' : learned.length ? 'Продолжить путь' : 'Начать с простого'}<span>→</span></button></div>
        <button className="review-link" disabled={!learned.length} onClick={() => start(due.length ? due : learned, 'Повторяем пройденное')}><span className="review-symbol">↺</span><span><strong>Повторить пройденное</strong><small>{due.length ? `${due.length} ${due.length === 1 ? 'термин ждёт' : 'терминов ждут'} повторения` : nextDue ? `По расписанию — ${new Date(nextDue).toLocaleDateString('ru-RU', {day:'numeric',month:'long'})}. Можно раньше` : 'Здесь появятся знакомые термины'}</small></span><span className="review-count">{due.length || '→'}</span></button>
        <p className="storage-note" role="status">{sync==='pending' ? 'Прогресс на устройстве. Синхронизируем при появлении связи.' : sync==='storage-error' ? 'Не удалось сохранить на устройстве. Не закрывай приложение до синхронизации.' : 'В твоём темпе. Даже несколько минут — уже шаг вперёд.'}</p>
      </section>
      <section className="path-panel" aria-label="Путь обучения"><div className="path-heading"><div><span className="tiny-label">ПРОСТО СЛЕДУЙ ЗА ЛЮБОПЫТСТВОМ</span><h2>Твой путь</h2></div><span className="path-counter">{completed}<span> / {TERM_LESSONS.length}</span></span></div><div className="path-track"><span style={{width:`${completed / TERM_LESSONS.length * 100}%`}}/></div><div className="lesson-path">{TERM_LESSONS.map((lesson,i)=>{
        const count = lesson.terms.filter(t=>memory[t.id]).length;
        const done = count === lesson.terms.length;
        const locked = nextLesson >= 0 && i > nextLesson;
        const current = i === nextLesson;
        return <div className={`path-stop ${done?'is-done':''} ${current?'is-current':''} ${locked?'is-locked':''}`} key={lesson.title}><span className="path-node">{done?'✓':String(i+1).padStart(2,'0')}</span><button className="lesson-stop" disabled={locked} onClick={()=>startLesson(i)}><span className={`lesson-mini mini-${i}`}><TermArt kind={lesson.terms[0].picture}/></span><span className="stop-copy"><span className="stop-label">{current?'ТЫ ЗДЕСЬ':done?'ПРОЙДЕНО':`ШАГ ${String(i+1).padStart(2,'0')}`}</span><strong>{lesson.title}</strong><small>{lesson.subtitle}</small><span className="term-dots" aria-label={`${count} из 4 терминов`}>{lesson.terms.map(t=><i key={t.id} className={memory[t.id]?'filled':''}/>)}</span></span><span className="stop-arrow">{locked?<svg viewBox="0 0 20 20" width="16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="9" width="12" height="9" rx="3"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>:'↗'}</span></button></div>;
      })}</div><div className="path-end"><span>✦</span><p>Понимание складывается<br/>из маленьких открытий.</p></div></section>
    </main> : finished ? <main className="session-page finish-page"><div className="finish-spark">✦</div><span className="eyebrow">ЕЩЁ ОДИН ШАГ ВПЕРЁД</span><h1>{score === session.cards.length ? 'Всё получилось.' : 'Теперь чуть понятнее.'}</h1><p>{score} из {session.cards.length} верно. {mistakes.length ? 'Ошибки — часть обучения. Вернёмся к этим понятиям.' : 'Новые знания на своём месте.'}</p><div className="review-plan"><span>↺</span><div><strong>Мы поможем запомнить</strong><p>Повторения через 1, 3, 7 и 21 день.<br/>Следующий срок — на твоём пути.</p></div></div>{mistakes.length>0&&<button className="primary" onClick={()=>start(mistakes,'Закрепляем сложное')}>Разобраться с ошибками<span>→</span></button>}<button className={mistakes.length?'secondary':'primary'} onClick={home}>Вернуться на путь<span>→</span></button></main> : card && <main className="session-page"><div className="session-top"><button className="close-button" onClick={()=>setConfirmExit(true)} aria-label="Закрыть урок">×</button><div className="question-track" role="progressbar" aria-label="Прогресс урока" aria-valuemin={0} aria-valuemax={session.cards.length} aria-valuenow={index+(chosen?1:0)}>{session.cards.map((_,i)=><i key={i} className={i<index||i===index&&chosen?'filled':''}/>)}</div><span>{index+1}<small> / {session.cards.length}</small></span></div><div key={card.term.id} className="question-body"><span className="tiny-label">{session.title}</span><h1>{card.term.name}</h1><div className="question-art"><TermArt kind={card.term.picture}/></div><p className="question-prompt">Что это такое?</p><div className="answer-options">{card.options.map((option,i)=>{
        const correct = option===card.term.definition;
        return <button key={option} disabled={chosen!==null} onClick={()=>select(option)} className={`answer-option ${chosen!==null&&correct?'answer-correct':''} ${chosen===option&&!correct?'answer-wrong':''}`}><span className="option-letter">{chosen!==null&&correct?'✓':chosen===option?'×':['А','Б','В','Г'][i]}</span><span>{option}</span></button>;
      })}</div>{chosen!==null&&<div ref={feedback} className={`answer-feedback ${chosen===card.term.definition?'positive':''}`} role="status"><strong>{chosen===card.term.definition?'Именно так.':'Ничего страшного. Разберёмся.'}</strong><p>{card.term.explanation}</p><button className="primary" onClick={advance}>{index+1===session.cards.length?'Завершить урок':'Следующий термин'}<span>→</span></button></div>}</div></main>}
    {confirmExit&&<div className="dialog-backdrop"><section className="exit-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-title" onKeyDown={event=>{
      if(event.key==='Escape'){setConfirmExit(false);return;}
      if(event.key==='Tab'){
        const buttons=event.currentTarget.querySelectorAll('button');
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    }}><h2 id="exit-title">Сделаем паузу?</h2><p>Ответы уже сохранены. Продолжишь с оставшихся терминов.</p><button autoFocus className="primary" onClick={()=>setConfirmExit(false)}>Продолжить урок</button><button className="secondary" onClick={home}>Вернуться на путь</button></section></div>}
    <footer className="journey-footer"><span>контур · учиться понимать</span><span>24 термина. бесконечно полезно.</span></footer>
  </div>;
}
