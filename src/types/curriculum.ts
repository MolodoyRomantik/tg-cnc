export interface Question {
  q: string;
  o: [string, string, string, string];
  a: number;
  e: string;
  img?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  est: string;
  theory: string[];
  questions: Question[];
}

export interface Level {
  id: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}
