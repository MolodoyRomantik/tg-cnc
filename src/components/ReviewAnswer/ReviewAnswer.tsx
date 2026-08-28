import type { Question } from '../../types/curriculum';
import { ImagePlaceholder } from '../ImagePlaceholder/ImagePlaceholder';
import quizStyles from '../Quiz/Quiz.module.css';
import styles from './ReviewAnswer.module.css';

const LETTERS = ['А', 'Б', 'В', 'Г'];

interface ReviewAnswerProps {
  question: Question;
  chosenIndex: number;
  questionNumber: number;
  total: number;
  onBack: () => void;
}

export function ReviewAnswer({ question, chosenIndex, questionNumber, total, onBack }: ReviewAnswerProps) {
  const isCorrect = chosenIndex === question.a;

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <span className={styles.label}>
          Разбор · вопрос {questionNumber} из {total}
        </span>
        <h2 className={quizStyles.question}>{question.q}</h2>
        <div className={quizStyles.options} style={{ flex: '0 0 auto' }}>
          {question.o.map((text, i) => {
            const isCorrectOption = i === question.a;
            const isChosen = i === chosenIndex;
            let state = '';
            if (isCorrectOption) state = quizStyles.correct;
            else if (isChosen) state = quizStyles.incorrect;
            else state = quizStyles.dim;
            return (
              <div key={i} className={`${quizStyles.option} ${state}`}>
                <span className={quizStyles.badge}>{LETTERS[i]}</span>
                <span className={quizStyles.optionText}>{text}</span>
                <span className={quizStyles.mark}>
                  {isCorrectOption ? '✓' : isChosen ? '✕' : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div className={quizStyles.explain} style={{ borderLeftColor: isCorrect ? 'var(--a-ok)' : 'var(--a-bad)' }}>
          <div className={quizStyles.explainTitle} style={{ color: isCorrect ? 'var(--a-ok)' : 'var(--a-bad)' }}>
            {isCorrect ? 'Верно' : 'Неверно'}
          </div>
          <p className={quizStyles.explainText}>{question.e}</p>
          {!isCorrect && question.img && (
            <div className={quizStyles.explainImage}>
              <ImagePlaceholder height={130} />
            </div>
          )}
        </div>
      </div>

      <div className={quizStyles.footer}>
        <button type="button" className={styles.back} onClick={onBack}>
          К итогу
        </button>
      </div>
    </div>
  );
}
