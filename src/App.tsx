import { useEffect, useState } from 'react';
import { NavBar } from './components/NavBar/NavBar';
import { TabBar } from './components/TabBar/TabBar';
import { Home } from './components/Home/Home';
import { Lesson } from './components/Lesson/Lesson';
import { Quiz, type QuizResult } from './components/Quiz/Quiz';
import { Result } from './components/Result/Result';
import { ReviewAnswer } from './components/ReviewAnswer/ReviewAnswer';
import { Profile } from './components/Profile/Profile';
import { LEVELS } from './data/curriculum';
import { PASS, useProgress } from './state/progress';
import { shuffleLessonQuestions } from './lib/quiz';
import { hapticNotify, setBackButtonVisible } from './telegram';
import type { Question } from './types/curriculum';
import styles from './App.module.css';

type Screen = 'home' | 'lesson' | 'quiz' | 'result' | 'review' | 'profile';

function scoreOf(result: QuizResult): number {
  return result.chosenAnswers.filter((chosen, i) => chosen === result.questions[i].a).length;
}

function App() {
  const { state: progress, recordAttempt } = useProgress();

  const [screen, setScreen] = useState<Screen>('home');
  const [tab, setTab] = useState<'home' | 'profile'>('home');
  const [levelIdx, setLevelIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null);
  const [quizStartedAt, setQuizStartedAt] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const level = LEVELS[levelIdx];
  const lesson = level?.lessons[lessonIdx];

  function openLesson(li: number, lsi: number) {
    setLevelIdx(li);
    setLessonIdx(lsi);
    setScreen('lesson');
  }

  function startQuiz(onlyIndexes?: number[]) {
    if (!lesson) return;
    const pool = onlyIndexes ? onlyIndexes.map((i) => lesson.questions[i]) : lesson.questions;
    setQuizQuestions(shuffleLessonQuestions(pool));
    setQuizStartedAt(Date.now());
    setScreen('quiz');
  }

  function finishQuiz(result: QuizResult) {
    if (!lesson) return;
    setLastResult(result);
    recordAttempt(lesson.id, scoreOf(result), result.questions.length);
    setScreen('result');
  }

  function retryMistakes() {
    if (!lastResult) return;
    const wrong = lastResult.chosenAnswers
      .map((chosen, i) => (chosen === lastResult.questions[i].a ? -1 : i))
      .filter((i) => i >= 0);
    setQuizQuestions(shuffleLessonQuestions(wrong.map((i) => lastResult.questions[i])));
    setQuizStartedAt(Date.now());
    setScreen('quiz');
  }

  function advanceOrRepeat() {
    if (!lastResult || !level) return;
    const passed = scoreOf(lastResult) / lastResult.questions.length >= PASS;
    if (!passed) {
      setScreen('lesson');
      return;
    }
    if (lessonIdx + 1 < level.lessons.length) openLesson(levelIdx, lessonIdx + 1);
    else if (levelIdx + 1 < LEVELS.length) openLesson(levelIdx + 1, 0);
    else {
      setScreen('home');
      setTab('home');
    }
  }

  function goHome() {
    setScreen('home');
    setTab('home');
  }

  function goBack() {
    if (screen === 'quiz' || screen === 'result') setScreen('lesson');
    else if (screen === 'review') setScreen('result');
    else if (screen === 'lesson') goHome();
  }

  useEffect(() => {
    setBackButtonVisible(screen !== 'home' && screen !== 'profile', goBack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const titles: Record<Screen, string> = {
    home: 'CNC Тренажёр',
    lesson: lesson ? `Урок ${lesson.id}` : 'Урок',
    quiz: lesson ? lesson.id : '',
    result: 'Итог урока',
    review: 'Разбор',
    profile: 'Профиль',
  };

  return (
    <div className={styles.shell}>
      <NavBar title={titles[screen]} showBack={screen !== 'home' && screen !== 'profile'} onBack={goBack} />

      {screen === 'home' && <Home levels={LEVELS} progress={progress} onOpenLesson={openLesson} />}

      {screen === 'lesson' && lesson && (
        <Lesson lesson={lesson} progress={progress.lessons[lesson.id]} onStart={() => startQuiz()} />
      )}

      {screen === 'quiz' && lesson && quizQuestions && (
        <Quiz
          key={quizStartedAt}
          lesson={lesson}
          questions={quizQuestions}
          onFinish={finishQuiz}
          onAnswered={(correct) => hapticNotify(correct ? 'success' : 'error')}
        />
      )}

      {screen === 'result' && lesson && lastResult && (
        <Result
          lesson={lesson}
          result={lastResult}
          elapsedMs={Date.now() - (quizStartedAt ?? Date.now())}
          lessonBest={progress.lessons[lesson.id]?.best ?? null}
          onReviewQuestion={(i) => {
            setReviewIndex(i);
            setScreen('review');
          }}
          onRetryMistakes={retryMistakes}
          onRestart={() => startQuiz()}
          onPrimaryAction={advanceOrRepeat}
          onHome={goHome}
        />
      )}

      {screen === 'review' && lastResult && reviewIndex !== null && (
        <ReviewAnswer
          question={lastResult.questions[reviewIndex]}
          chosenIndex={lastResult.chosenAnswers[reviewIndex]}
          questionNumber={reviewIndex + 1}
          total={lastResult.questions.length}
          onBack={() => setScreen('result')}
        />
      )}

      {screen === 'profile' && <Profile levels={LEVELS} progress={progress} />}

      {(screen === 'home' || screen === 'profile') && (
        <TabBar
          active={tab}
          onHome={() => {
            setTab('home');
            setScreen('home');
          }}
          onProfile={() => {
            setTab('profile');
            setScreen('profile');
          }}
        />
      )}
    </div>
  );
}

export default App;
