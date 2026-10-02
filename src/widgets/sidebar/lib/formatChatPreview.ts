import type { Chat } from 'shared/types/domain';

export function formatTs(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mo}`;
}

export function lastMessagePreview(chat: Chat): string {
  if (chat.messages.length === 0) return 'Нет сообщений';
  const last = chat.messages[chat.messages.length - 1];
  const prefix = last.direction === 'out' ? 'Вы: ' : '';
  const text = last.text.replace(/\s+/g, ' ').trim();
  return prefix + (text.length > 60 ? text.slice(0, 57) + '…' : text);
}

export function lastTs(chat: Chat): number {
  if (chat.messages.length === 0) return chat.createdAt;
  return chat.messages[chat.messages.length - 1].ts;
}