export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorContext {
  question: string;
  options: string[];
  correctAnswer: string;
  chosenAnswer: string;
  explanation: string;
}

function buildSystemPrompt(ctx: TutorContext): string {
  return `Ты — ИИ-репетитор в приложении для обучения программированию токарных станков с ЧПУ (стойка Fanuc 0i/21i). Ученик сейчас разбирает конкретный вопрос теста.

Вопрос: ${ctx.question}
Варианты ответа: ${ctx.options.join(' / ')}
Правильный ответ: ${ctx.correctAnswer}
Ответ ученика: ${ctx.chosenAnswer}
Официальный разбор: ${ctx.explanation}

Помоги ученику разобраться в теме. Отвечай по-русски, кратко (2-5 предложений), по существу, без вступлений и извинений. Если вопрос ученика не по теме ЧПУ/токарной обработки — вежливо верни разговор к теме урока.`;
}

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[];
}

export async function askDeepSeek(
  apiKey: string,
  context: TutorContext,
  history: TutorMessage[],
): Promise<string> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: buildSystemPrompt(context) }, ...history],
      max_tokens: 400,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as DeepSeekResponse;
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error('DeepSeek API returned no content');
  return reply;
}
