import { describe, expect, it } from 'vitest';
import { extractCodes, shuffleLessonQuestions, shuffleQuestion } from './quiz';
import type { Lesson, Question } from '../types/curriculum';

const QUESTION: Question = {
  q: 'Что делает G96?',
  o: ['Правильный', 'Б', 'В', 'Г'],
  a: 0,
  e: 'G96 включает постоянную скорость резания.',
};

describe('shuffleQuestion', () => {
  it('keeps the same 4 options as a set and points `a` at the right text', () => {
    for (let i = 0; i < 30; i++) {
      const shuffled = shuffleQuestion(QUESTION);
      expect(shuffled.o).toHaveLength(4);
      expect([...shuffled.o].sort()).toEqual([...QUESTION.o].sort());
      expect(shuffled.o[shuffled.a]).toBe('Правильный');
    }
  });

  it('does not mutate the original question', () => {
    const before = [...QUESTION.o];
    shuffleQuestion(QUESTION);
    expect(QUESTION.o).toEqual(before);
  });
});

describe('shuffleLessonQuestions', () => {
  it('returns every question, each with a still-correct `a` index', () => {
    const questions: Question[] = [
      QUESTION,
      { ...QUESTION, q: 'Q2', o: ['1', '2', 'Верно', '4'], a: 2 },
      { ...QUESTION, q: 'Q3', o: ['a', 'b', 'c', 'Верно'], a: 3 },
    ];
    const shuffled = shuffleLessonQuestions(questions);
    expect(shuffled).toHaveLength(3);
    expect(new Set(shuffled.map((q) => q.q))).toEqual(new Set(questions.map((q) => q.q)));
    for (const q of shuffled) {
      const original = questions.find((orig) => orig.q === q.q)!;
      expect(q.o[q.a]).toBe(original.o[original.a]);
    }
  });
});

describe('extractCodes', () => {
  it('finds G/M codes across questions and explanations, deduped and in first-seen order', () => {
    const lesson: Lesson = {
      id: '1.4',
      title: 'test',
      est: '1 мин',
      theory: [],
      questions: [
        { q: 'Что делает G96?', o: ['1', '2', '3', '4'], a: 0, e: 'См. также G97 и G96.' },
        { q: 'А G50?', o: ['1', '2', '3', '4'], a: 0, e: 'Ограничивает обороты.' },
      ],
    };
    expect(extractCodes(lesson)).toEqual(['G96', 'G97', 'G50']);
  });

  it('caps at 10 codes', () => {
    const lesson: Lesson = {
      id: 'x',
      title: 'test',
      est: '1 мин',
      theory: [],
      questions: Array.from({ length: 12 }, (_, i) => ({
        q: `G${i}0`,
        o: ['1', '2', '3', '4'],
        a: 0,
        e: '',
      })),
    };
    expect(extractCodes(lesson)).toHaveLength(10);
  });
});
