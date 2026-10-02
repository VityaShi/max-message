import { useEffect, useRef } from 'react';
import type { Message } from 'shared/types/domain';
import { buildItems } from '../lib/buildItems';
import { formatTime } from '../lib/format';
import styles from './MessageList.module.css';

export type MessageListProps = {
  messages: Message[];
  onRetry: (id: string) => void;
};

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
  const items = buildItems(messages);

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