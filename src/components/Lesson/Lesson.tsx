import type { Lesson as LessonType } from '../../types/curriculum';
import type { LessonProgress } from '../../state/progress';
import { PASS } from '../../state/progress';
import { extractCodes } from '../../lib/quiz';
import { formatRelativeDate } from '../../lib/date';
import { ImagePlaceholder } from '../ImagePlaceholder/ImagePlaceholder';
import styles from './Lesson.module.css';

interface LessonProps {
  lesson: LessonType;
  progress: LessonProgress | undefined;
  onStart: () => void;
}

export function Lesson({ lesson, progress, onStart }: LessonProps) {
  const total = lesson.questions.length;
  const codes = extractCodes(lesson);
  const passMark = `${Math.ceil(total * PASS)}/${total}`;

  const statusText = !progress ? 'Не начат' : progress.passed ? 'Зачтён' : 'Не зачтён';
  const statusColor = !progress ? 'var(--a-text2)' : progress.passed ? 'var(--a-ok)' : 'var(--a-bad)';
  const lastAttemptText = progress ? formatRelativeDate(progress.lastAt) : 'не проходился';
  const bestText = progress ? `${progress.best}/${progress.total}` : '—';

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <div>
          <div className={styles.eyebrow}>
            УРОК {lesson.id} · {lesson.est.toUpperCase()}
          </div>
          <h1 className={styles.title}>{lesson.title}</h1>
        </div>

        <div className={styles.theoryCard}>
          <div className={styles.theoryHead}>Кратко перед тестом</div>
          {lesson.theory.map((text, i) => (
            <div key={i} className={styles.theoryRow} style={{ borderTop: i === 0 ? 'none' : undefined }}>
              <span className={styles.theoryNum}>{i + 1}</span>
              <span className={styles.theoryText}>{text}</span>
            </div>
          ))}
        </div>

        <div className={styles.imageSlot}>
          <ImagePlaceholder height={150} caption="Иллюстрация урока появится позже" />
        </div>

        {codes.length > 0 && (
          <div>
            <div className={styles.sectionLabel}>Что разбираем</div>
            <div className={styles.tags}>
              {codes.map((code) => (
                <span key={code} className={styles.tag}>
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Последняя попытка</span>
            <span className={styles.infoValue}>{lastAttemptText}</span>
          </div>
          <div className={styles.infoRow} style={{ borderTop: '.5px solid var(--a-hairline)' }}>
            <span className={styles.infoLabel}>Статус</span>
            <span className={styles.infoValue} style={{ color: statusColor }}>
              {statusText}
            </span>
          </div>
        </div>

        <div className={styles.tiles}>
          <div className={styles.tile}>
            <div className={styles.tileValue}>{total}</div>
            <div className={styles.tileLabel}>вопросов</div>
          </div>
          <div className={styles.tile}>
            <div className={styles.tileValue} style={{ color: 'var(--a-ok)' }}>
              {passMark}
            </div>
            <div className={styles.tileLabel}>порог зачёта</div>
          </div>
          <div className={styles.tile}>
            <div className={styles.tileValue} style={{ color: 'var(--a-accent)' }}>
              {bestText}
            </div>
            <div className={styles.tileLabel}>лучший счёт</div>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.startButton} onClick={onStart}>
          Пройти тест
        </button>
      </div>
    </div>
  );
}
