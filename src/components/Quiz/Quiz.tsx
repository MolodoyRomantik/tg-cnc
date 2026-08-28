import { useState } from 'react';
import type { Lesson, Question } from '../../types/curriculum';
import { ImagePlaceholder } from '../ImagePlaceholder/ImagePlaceholder';
import styles from './Quiz.module.css';

const LETTERS = ['А', 'Б', 'В', 'Г'];

export interface QuizResult {
  questions: Question[];
  chosenAnswers: number[];
}

interface QuizProps {
  lesson: Lesson;
  questions: Question[];
  onFinish: (result: QuizResult) => void;
  onAnswered?: (correct: boolean) => void;
}

export function Quiz({ lesson, questions, onFinish, onAnswered }: QuizProps) {
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [chosenAnswers, setChosenAnswers] = useState<number[]>([]);

  const total = questions.length;
  const current = questions[qIdx];
  const isAnswered = chosen !== null;
  const isCorrect = isAnswered && chosen === current.a;
  const isLast = qIdx === total - 1;

  function handleSelect(i: number) {
    if (isAnswered) return;
    setChosen(i);
    onAnswered?.(i === current.a);
  }

  function handleNext() {
    if (chosen === null) return;
    const nextAnswers = [...chosenAnswers, chosen];
    if (isLast) {
      onFinish({ questions, chosenAnswers: nextAnswers });
      return;
    }
    setChosenAnswers(nextAnswers);
    setQIdx((i) => i + 1);
    setChosen(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.progressRow}>
          {questions.map((question, i) => {
            let segClass = styles.segFuture;
            if (i < chosenAnswers.length) {
              segClass = chosenAnswers[i] === question.a ? styles.segCorrect : styles.segWrong;
            } else if (i === qIdx) {
              segClass = styles.segCurrent;
            }
            return <span key={i} className={`${styles.seg} ${segClass}`} />;
          })}
        </div>
        <div className={styles.meta}>
          <span className={styles.metaLabel}>
            Вопрос {qIdx + 1} из {total}
          </span>
          <span className={styles.metaCode}>УРОК {lesson.id}</span>
        </div>
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.question}>{current.q}</h2>
        <div className={styles.options} style={{ flex: isAnswered ? '0 0 auto' : '1 1 auto' }}>
          {current.o.map((text, i) => {
            const isCorrectOption = i === current.a;
            const isChosen = i === chosen;
            let state = '';
            if (isAnswered && isCorrectOption) state = styles.correct;
            else if (isAnswered && isChosen) state = styles.incorrect;
            else if (isAnswered) state = styles.dim;
            return (
              <button
                key={i}
                type="button"
                className={`${styles.option} ${state}`}
                disabled={isAnswered}
                onClick={() => handleSelect(i)}
              >
                <span className={styles.badge}>{LETTERS[i]}</span>
                <span className={styles.optionText}>{text}</span>
                <span className={styles.mark}>
                  {isAnswered && isCorrectOption ? '✓' : isAnswered && isChosen ? '✕' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={styles.explain} style={{ borderLeftColor: isCorrect ? 'var(--a-ok)' : 'var(--a-bad)' }}>
            <div className={styles.explainTitle} style={{ color: isCorrect ? 'var(--a-ok)' : 'var(--a-bad)' }}>
              {isCorrect ? 'Верно' : 'Неверно'}
            </div>
            <p className={styles.explainText}>{current.e}</p>
            {!isCorrect && current.img && (
              <div className={styles.explainImage}>
                <ImagePlaceholder height={130} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.next}
          disabled={!isAnswered}
          onClick={handleNext}
        >
          {isLast ? 'К результату' : 'Далее'}
        </button>
      </div>
    </div>
  );
}
