import { getInitDataRaw } from '../telegram';
import { API_BASE } from './api';

export interface TutorContext {
  question: string;
  options: string[];
  correctAnswer: string;
  chosenAnswer: string;
  explanation: string;
}

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askTutor(
  context: TutorContext,
  history: TutorMessage[],
  message: string,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/tutor`, {
    method: 'POST',
    headers: {
      Authorization: `tma ${getInitDataRaw()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context, history, message }),
  });
  if (!res.ok) {
    throw new Error(`tutor request failed: ${res.status}`);
  }
  const data = (await res.json()) as { reply: string };
  return data.reply;
}
