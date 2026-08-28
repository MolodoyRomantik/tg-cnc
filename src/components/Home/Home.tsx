import type { Level } from '../../types/curriculum';
import {
  computeAccuracy,
  computeSolved,
  computeStreak,
  type ProgressState,
} from '../../state/progress';
import styles from './Home.module.css';

interface HomeProps {
  levels: Level[];
  progress: ProgressState;
  onOpenLesson: (levelIdx: number, lessonIdx: number) => void;
}

export function Home({ levels, progress, onOpenLesson }: HomeProps) {
  const lessonTotal = levels.reduce((n, lv) => n + lv.lessons.length, 0);
  const qTotal = levels.reduce((n, lv) => n + lv.lessons.reduce((m, ls) => m + ls.questions.length, 0), 0);

  const streak = computeStreak(progress);
  const solved = computeSolved(progress);
  const accuracy = computeAccuracy(progress);

  let next: { levelIdx: number; lessonIdx: number; title: string; id: string } | null = null;
  outer: for (let li = 0; li < levels.length; li++) {
    for (let lsi = 0; lsi < levels[li].lessons.length; lsi++) {
      const lesson = levels[li].lessons[lsi];
      if (!progress.lessons[lesson.id]?.passed) {
        next = { levelIdx: li, lessonIdx: lsi, title: lesson.title, id: lesson.id };
        break outer;
      }
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Токарное ЧПУ</h1>
        <p className={styles.subtitle}>
          Стойка Fanuc · {lessonTotal} уроков, {qTotal} вопросов
        </p>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--a-accent)' }}>
            {streak}
          </div>
          <div className={styles.statLabel}>дней подряд</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{solved}</div>
          <div className={styles.statLabel}>вопросов</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: 'var(--a-ok)' }}>
            {accuracy !== null ? `${accuracy}%` : '—'}
          </div>
          <div className={styles.statLabel}>точность</div>
        </div>
      </div>

      {next && (
        <button
          type="button"
          className={styles.continueCard}
          onClick={() => onOpenLesson(next!.levelIdx, next!.lessonIdx)}
        >
          <span className={styles.continueTile}>{next.id}</span>
          <span className={styles.continueBody}>
            <span className={styles.continueEyebrow}>Продолжить</span>
            <span className={styles.continueTitle}>{next.title}</span>
          </span>
          <span className={styles.chevron}>›</span>
        </button>
      )}

      {levels.map((level, li) => {
        const doneCount = level.lessons.filter((ls) => progress.lessons[ls.id]?.passed).length;
        const closed = doneCount === level.lessons.length;
        return (
          <div key={level.id} className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle} style={{ color: closed ? 'var(--a-ok)' : 'var(--a-text2)' }}>
                {level.title}
              </span>
              <span className={styles.sectionProgress}>
                {doneCount}/{level.lessons.length}
              </span>
            </div>
            <div className={styles.lessonCard}>
              {level.lessons.map((lesson, lsi) => {
                const lp = progress.lessons[lesson.id];
                const mark = lp?.passed ? '✓' : lp ? `${lp.best}/${lp.total}` : '›';
                const markColor = lp?.passed ? 'var(--a-ok)' : lp ? 'var(--a-accent)' : 'var(--a-text3)';
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    className={styles.lessonRow}
                    style={{ borderTop: lsi === 0 ? 'none' : undefined }}
                    onClick={() => onOpenLesson(li, lsi)}
                  >
                    <span
                      className={styles.lessonTile}
                      style={{
                        background: lp?.passed ? 'var(--a-ok-soft)' : lp ? 'var(--a-accent-soft)' : 'var(--a-fill)',
                        color: lp?.passed ? 'var(--a-ok)' : lp ? 'var(--a-accent)' : 'var(--a-text2)',
                      }}
                    >
                      {lesson.id}
                    </span>
                    <span className={styles.lessonBody}>
                      <span className={styles.lessonTitle}>{lesson.title}</span>
                      <span className={styles.lessonMeta}>
                        {lesson.questions.length} вопросов · {lesson.est}
                      </span>
                    </span>
                    <span className={styles.lessonMark} style={{ color: markColor }}>
                      {mark}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
