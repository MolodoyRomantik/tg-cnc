import type { Lesson, Question } from '../types/curriculum';

/** Fisher–Yates shuffle of a question's options, correct index recomputed. */
export function shuffleQuestion(question: Question): Question {
  const order = question.o.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const o = order.map((i) => question.o[i]) as Question['o'];
  const a = order.indexOf(question.a);
  return { ...question, o, a };
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Question order + option order shuffled fresh for a new attempt. */
export function shuffleLessonQuestions(questions: Question[]): Question[] {
  return shuffleArray(questions).map(shuffleQuestion);
}

const CODE_RE = /[GM]\d{2,3}/g;

/** G/M-code tags found across a lesson's questions + explanations, in first-seen order. */
export function extractCodes(lesson: Lesson): string[] {
  const found: string[] = [];
  for (const item of lesson.questions) {
    const text = `${item.q} ${item.e}`;
    const codes = text.match(CODE_RE) ?? [];
    for (const c of codes) if (!found.includes(c)) found.push(c);
  }
  return found.slice(0, 10);
}
