import { useEffect, useMemo, useRef } from 'react';
import type { Message } from '../types/domain';
import styles from './MessageList.module.css';

export type MessageListProps = {
  messages: Message[];
  onRetry: (id: string) => void;
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'сегодня';
  if (sameDay(d, yesterday)) return 'вчера';
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

type Item =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'msg'; msg: Message };

function buildItems(messages: Message[]): Item[] {
  const items: Item[] = [];
  let lastDay: string | null = null;
  for (const m of messages) {
    const dk = dayKey(m.ts);
    if (dk !== lastDay) {
      items.push({ kind: 'date', key: `d-${dk}`, label: formatDate(m.ts) });
      lastDay = dk;
    }
    items.push({ kind: 'msg', msg: m });
  }
  return items;
}

function StatusMark({ message }: { message: Message }) {
  if (message.direction === 'in') return null;
  if (message.status === 'sending') {
    return <span className={styles.statusIcon} title="Отправка">···</span>;
  }
  if (message.status === 'failed') {
    return (
      <span className={`${styles.statusIcon} ${styles.statusIconFailed}`}>
        !
      </span>
    );
  }
  return (
    <span
      className={`${styles.statusIcon} ${styles.statusIconSent}`}
      title="Доставлено"
    >
      ✓✓
    </span>
  );
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const items = useMemo(() => buildItems(messages), [messages]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.list}>
        <div className={styles.empty}>
          <strong>Сообщений пока нет</strong>
          Напишите первое сообщение — получатель увидит его в MAX.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list} ref={ref}>
      {items.map((item) => {
        if (item.kind === 'date') {
          return (
            <div key={item.key} className={styles.dateSeparator}>
              {item.label}
            </div>
          );
        }
        const m = item.msg;
        const isOut = m.direction === 'out';
        return (
          <div
            key={m.id}
            className={`${styles.row} ${isOut ? styles.rowOut : styles.rowIn}`}
          >
            <div
              className={`${styles.bubble} ${isOut ? styles.bubbleOut : styles.bubbleIn}`}
            >
              <div>{m.text}</div>
              <div className={styles.meta}>
                <span>{formatTime(m.ts)}</span>
                <StatusMark message={m} />
                {m.status === 'failed' && (
                  <button
                    type="button"
                    className={styles.retry}
                    onClick={() => onRetry(m.id)}
                  >
                    повторить
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}