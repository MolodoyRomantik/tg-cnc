import type { Level } from '../../types/curriculum';
import { computeAccuracy, computeLevel, computeSolved, computeStreak, computeXp, type ProgressState } from '../../state/progress';
import styles from './Home.module.css';

interface HomeProps { levels: Level[]; progress: ProgressState; onOpenLesson: (levelIdx: number, lessonIdx: number) => void; }

const paths = [
  { icon: '⌁', title: 'Термины ЧПУ', text: 'Словарь станочника', tone: 'orange', live: true },
  { icon: '</>', title: 'Программирование', text: 'Fanuc ISO · скоро', tone: 'blue', live: false },
  { icon: '◉', title: 'Наладка станка', text: 'Инструмент и режимы · скоро', tone: 'green', live: false },
  { icon: '⌑', title: 'Чтение чертежей', text: 'Размеры и допуски · скоро', tone: 'violet', live: false },
] as const;

export function Home({ levels, progress, onOpenLesson }: HomeProps) {
  const lessonTotal = levels.reduce((n, lv) => n + lv.lessons.length, 0);
  const streak = computeStreak(progress); const solved = computeSolved(progress); const accuracy = computeAccuracy(progress);
  const xp = computeXp(progress); const { level, into, goal } = computeLevel(xp);
  const completed = levels.reduce((n, item) => n + item.lessons.filter((lesson) => progress.lessons[lesson.id]?.passed).length, 0);
  let next: { levelIdx: number; lessonIdx: number; title: string; id: string } | null = null;
  outer: for (let li = 0; li < levels.length; li++) for (let lsi = 0; lsi < levels[li].lessons.length; lsi++) { const lesson = levels[li].lessons[lsi]; if (!progress.lessons[lesson.id]?.passed) { next = { levelIdx: li, lessonIdx: lsi, title: lesson.title, id: lesson.id }; break outer; } }
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.heroTop}><div><span className={styles.kicker}>CNC ACADEMY</span><h1 className={styles.title}>Твой путь<br />к станку</h1></div><div className={styles.rank}><span>{level}</span><small>уровень</small></div></div><div className={styles.machine} aria-hidden="true"><div className={styles.machineScreen}><i /><i /><i /></div><div className={styles.machineChuck}><b /></div><div className={styles.machineLines} /></div><div className={styles.xpLine}><span>Опыт <b>{xp} XP</b></span><span>{into}/{goal}</span></div><div className={styles.track}><span style={{ width: `${Math.max(5, (into / goal) * 100)}%` }} /></div></section>
    <section className={styles.stats}><div><b className={styles.fire}>◆</b><strong>{streak}</strong><span>дней подряд</span></div><div><b>{solved}</b><span>решено задач</span></div><div><b>{accuracy === null ? '—' : `${accuracy}%`}</b><span>точность</span></div></section>
    {next && <button className={styles.continue} type="button" onClick={() => onOpenLesson(next!.levelIdx, next!.lessonIdx)}><span className={styles.play}>▶</span><span><small>ПРОДОЛЖИТЬ ОБУЧЕНИЕ</small><strong>{next.title}</strong><em>Урок {next.id} · 5–7 минут</em></span><i>→</i></button>}
    <section className={styles.paths}><div className={styles.sectionHead}><h2>Направления</h2><span>{completed}/{lessonTotal} уроков</span></div><div className={styles.pathGrid}>{paths.map((path) => <button type="button" key={path.title} className={`${styles.path} ${styles[path.tone]} ${!path.live ? styles.locked : ''}`} onClick={() => path.live && next && onOpenLesson(next.levelIdx, next.lessonIdx)}><span className={styles.pathIcon}>{path.live ? path.icon : '🔒'}</span><strong>{path.title}</strong><small>{path.text}</small>{path.live && <span className={styles.pathProgress}>{completed}/{lessonTotal}</span>}</button>)}</div></section>
    <section className={styles.map}><div className={styles.sectionHead}><h2>Карта пути</h2><span>Токарное ЧПУ</span></div><div className={styles.mapCard}>{levels.map((item, index) => { const done = item.lessons.filter((lesson) => progress.lessons[lesson.id]?.passed).length; return <button key={item.id} type="button" className={styles.mapRow} onClick={() => onOpenLesson(index, 0)}><span className={styles.mapNum}>0{index + 1}</span><span className={styles.mapText}><strong>{item.title.replace(/^Уровень \d+ · /, '')}</strong><small>{done}/{item.lessons.length} уроков завершено</small></span><span className={styles.mapArrow}>→</span></button>; })}</div></section>
  </main>;
}
