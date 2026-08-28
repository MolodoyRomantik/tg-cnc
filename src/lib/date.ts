export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const dayMs = 86_400_000;
  const dateDay = Math.floor(date.getTime() / dayMs);
  const nowDay = Math.floor(now.getTime() / dayMs);
  const diff = nowDay - dateDay;

  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diff === 0) return `сегодня, ${time}`;
  if (diff === 1) return `вчера, ${time}`;
  if (diff > 1 && diff < 7) return `${diff} дн. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
