import type { ConnectionStatus } from '../types/domain';
import styles from './ChatHeader.module.css';

export type ChatHeaderProps = {
  title: string;
  chatId: string;
  status: ConnectionStatus;
  onLeave: () => void;
};

function initial(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '?';
  return trimmed.replace(/^\+?/, '').charAt(0);
}

function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'connecting':
      return 'подключение…';
    case 'online':
      return 'в сети';
    case 'reconnecting':
      return 'переподключение…';
    case 'offline':
      return 'нет соединения';
    default:
      return '';
  }
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5C5 3.67 5.67 3 6.5 3h2.34c.7 0 1.3.46 1.49 1.13l.79 2.83a1.5 1.5 0 0 1-.36 1.45L9.6 9.74a12 12 0 0 0 4.66 4.66l1.33-1.16a1.5 1.5 0 0 1 1.45-.36l2.83.79c.67.19 1.13.79 1.13 1.49v2.34c0 .83-.67 1.5-1.5 1.5C10.7 19 5 13.3 5 6.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16 10l5-3v10l-5-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 16l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChatHeader({
  title,
  chatId,
  status,
  onLeave,
}: ChatHeaderProps) {
  const visibleStatus: ConnectionStatus = status === 'idle' ? 'connecting' : status;
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.back}
        onClick={onLeave}
        aria-label="Назад"
        title="Назад"
      >
        ←
      </button>
      <div className={styles.avatar} aria-hidden="true">
        {initial(title)}
      </div>
      <div className={styles.meta}>
        <h2 className={styles.title}>{title || chatId}</h2>
        <div className={styles.subtitle}>
          <span className={`${styles.status} ${styles[visibleStatus]}`}>
            <span className={styles.dot} />
            {statusLabel(visibleStatus)}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Позвонить">
          <PhoneIcon />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Видеозвонок">
          <VideoIcon />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Поиск">
          <SearchIcon />
        </button>
      </div>
    </div>
  );
}