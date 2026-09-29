import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import styles from './MessageInput.module.css';

export type MessageInputProps = {
  onSend: (text: string) => Promise<{ ok: boolean; error?: string }>;
  disabled?: boolean;
};

const MAX_LENGTH = 4000;

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 6.5l-7.8 7.8a3 3 0 1 0 4.24 4.24l8.5-8.5a5 5 0 0 0-7.07-7.07L5.3 12.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 9l-6.5 6.5a1.5 1.5 0 0 0 2.12 2.12L17 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StickerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="11" r="1.2" fill="currentColor" />
      <circle cx="15" cy="11" r="1.2" fill="currentColor" />
      <path
        d="M9 14.5c1 1 4 1 6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="9"
        y="3.5"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9.5 20.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 140);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > 140 ? 'auto' : 'hidden';
  }, [value]);

  const submit = async () => {
    const text = value.trim();
    if (!text || pending || disabled) return;
    setPending(true);
    setError(null);
    const result = await onSend(text);
    setPending(false);
    if (result.ok) {
      setValue('');
    } else {
      setError(result.error ?? 'Не удалось отправить');
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  const canSend = value.trim().length > 0 && !pending && !disabled;

  return (
    <form className={styles.wrap} onSubmit={handleSubmit}>
      <button
        type="button"
        className={styles.attach}
        aria-label="Прикрепить"
        disabled
        title="Не реализовано"
      >
        <PaperclipIcon />
      </button>
      <textarea
        ref={textareaRef}
        className={styles.input}
        rows={1}
        placeholder={disabled ? 'Подключение…' : 'Сообщение'}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {canSend ? (
        <button
          type="submit"
          className={styles.send}
          aria-label="Отправить"
        >
          ➤
        </button>
      ) : (
        <div className={styles.rightActions}>
          <button
            type="button"
            className={styles.attach}
            aria-label="Стикер"
            disabled
            title="Не реализовано"
          >
            <StickerIcon />
          </button>
          <button
            type="button"
            className={styles.attach}
            aria-label="Голосовое сообщение"
            disabled
            title="Не реализовано"
          >
            <MicIcon />
          </button>
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </form>
  );
}