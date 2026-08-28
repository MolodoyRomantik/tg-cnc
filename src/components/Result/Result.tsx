import type { Lesson } from '../../types/curriculum';
import { PASS } from '../../state/progress';
import type { QuizResult } from '../Quiz/Quiz';
import styles from './Result.module.css';

interface ResultProps {
  lesson: Lesson;
  result: QuizResult;
  elapsedMs: number;
  lessonBest: number | null;
  onReviewQuestion: (index: number) => void;
  onRetryMistakes: () => void;
  onRestart: () => void;
  onPrimaryAction: () => void;
  onHome: () => void;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function Result({
  lesson,
  result,
  elapsedMs,
  lessonBest,
  onReviewQuestion,
  onRetryMistakes,
  onRestart,
  onPrimaryAction,
  onHome,
}: ResultProps) {
  const { questions, chosenAnswers } = result;
  const total = questions.length;
  const correctFlags = questions.map((question, i) => chosenAnswers[i] === question.a);
  const score = correctFlags.filter(Boolean).length;
  const ratio = total ? score / total : 0;
  const passed = ratio >= PASS;
  const xp = score * 5 + (passed ? 10 : 0);
  const wrongIndexes = correctFlags
    .map((ok, i) => (ok ? -1 : i))
    .filter((i) => i >= 0);

  const [gradeTitle, gradeText] =
    ratio >= 0.95
      ? ['Отлично', 'Урок закрыт без ошибок. Следующий доступен.']
      : passed
        ? ['Зачёт', 'Порог пройден. Разберись с ошибками — и вперёд.']
        : ratio >= 0.5
          ? ['Есть пробелы', 'Половина ответов верна. Пройди тест ещё раз и читай разборы.']
          : ['Нужно повторить', 'Вернись к теории и попробуй снова.'];

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <div className={styles.scoreRow}>
          <span className={styles.score}>{score}</span>
          <span className={styles.scoreTotal}>/{total}</span>
        </div>
        <div className={styles.gradeTitle}>{gradeTitle}</div>
        <p className={styles.gradeText}>{gradeText}</p>

        <div className={styles.reviewHead}>
          <span className={styles.sectionLabel}>Разбор по вопросам</span>
          <span className={styles.xp}>+{xp} XP</span>
        </div>
        <div className={styles.reviewStrip}>
          {correctFlags.map((ok, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.reviewCell} ${ok ? styles.reviewOk : styles.reviewBad}`}
              onClick={() => onReviewQuestion(i)}
            >
              <span>{ok ? '✓' : '✕'}</span>
              <span className={styles.reviewNum}>{i + 1}</span>
            </button>
          ))}
        </div>

        {wrongIndexes.length > 0 && (
          <div className={styles.wrongList}>
            {wrongIndexes.map((i, k) => (
              <button
                key={i}
                type="button"
                className={styles.wrongRow}
                style={{ borderTop: k === 0 ? 'none' : undefined }}
                onClick={() => onReviewQuestion(i)}
              >
                <span className={styles.wrongNum}>{i + 1}</span>
                <span className={styles.wrongText}>{questions[i].q}</span>
                <span className={styles.chevron}>›</span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.statsCard}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Время попытки</span>
            <span className={styles.statValue}>{formatElapsed(elapsedMs)}</span>
          </div>
          <div className={styles.statRow} style={{ borderTop: '.5px solid var(--a-hairline)' }}>
            <span className={styles.statLabel}>Лучший счёт по уроку</span>
            <span className={styles.statValue}>
              {lessonBest !== null ? `${lessonBest}/${total}` : '—'}
            </span>
          </div>
          <div className={styles.statRow} style={{ borderTop: '.5px solid var(--a-hairline)' }}>
            <span className={styles.statLabel}>Точность</span>
            <span className={styles.statValue}>{Math.round(ratio * 100)}%</span>
          </div>
        </div>

        <div className={styles.statusCard} style={{ background: passed ? 'var(--a-ok-soft)' : 'var(--a-steel-soft)' }}>
          <div className={styles.statusTitle} style={{ color: passed ? 'var(--a-ok)' : 'var(--a-text2)' }}>
            {passed ? 'Урок зачтён' : 'Урок не зачтён'}
          </div>
          <div className={styles.statusText}>
            {passed
              ? `Открыт следующий урок. Ошибки добавлены в повтор — «${lesson.title}» можно пройти ещё раз в любой момент.`
              : `Порог ${Math.round(PASS * 100)}%. Ошибочные вопросы стоит повторить.`}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        {wrongIndexes.length > 0 && (
          <button type="button" className={styles.retryWrong} onClick={onRetryMistakes}>
            Повторить только ошибки · {wrongIndexes.length}
          </button>
        )}
        <button type="button" className={styles.primary} onClick={onPrimaryAction}>
          {passed ? 'Следующий урок' : 'Повторить теорию'}
        </button>
        <div className={styles.row}>
          <button type="button" className={styles.secondary} onClick={onRestart}>
            Заново
          </button>
          <button type="button" className={styles.secondary} onClick={onHome}>
            К урокам
          </button>
        </div>
      </div>
    </div>
  );
}
