import { useState } from 'react';
import { askTutor, type TutorContext, type TutorMessage } from '../../lib/tutor';
import styles from './TutorChat.module.css';

interface TutorChatProps {
  context: TutorContext;
}

export function TutorChat({ context }: TutorChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setError(null);
    const history = messages;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const reply = await askTutor(context, history, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setError('Не получилось получить ответ. Попробуй ещё раз чуть позже.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className={styles.openButton} onClick={() => setOpen(true)}>
        Спросить ИИ про этот вопрос
      </button>
    );
  }

  return (
    <div className={styles.chat}>
      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.hint}>Спроси, если в разборе что-то осталось непонятным.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? styles.userMsg : styles.assistantMsg}>
            {m.content}
          </div>
        ))}
        {loading && <div className={styles.assistantMsg}>Печатает…</div>}
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="Например: почему не подходит вариант Б?"
          disabled={loading}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={send}
          disabled={loading || !input.trim()}
        >
          →
        </button>
      </div>
    </div>
  );
}
