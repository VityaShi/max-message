import { useMemo, useState, type FormEvent } from 'react';
import { buildPersonalChatId } from '../model/buildPersonalChatId';
import styles from './ChatForm.module.css';

export type ChatFormProps = {
  onSubmit: (chatId: string, title: string) => void;
  onCancel: () => void;
};

export function ChatForm({ onSubmit, onCancel }: ChatFormProps) {
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => buildPersonalChatId(phone), [phone]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!preview.chatId) {
      setError(preview.error ?? 'Неверный номер');
      return;
    }
    setError(null);
    onSubmit(preview.chatId, title.trim() || preview.title);
  };

  return (
    <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>Новый чат</h1>
      <p className={styles.subtitle}>Кому отправить сообщение?</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone">
          Номер телефона
        </label>
        <input
          id="phone"
          className={styles.input}
          type="tel"
          autoComplete="off"
          placeholder="+7 999 123-45-67 или 89991234567"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setError(null);
          }}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Название чата (необязательно)
        </label>
        <input
          id="title"
          className={styles.input}
          type="text"
          autoComplete="off"
          placeholder="Например, Работа"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {preview.chatId && (
        <div className={styles.preview}>chatId: {preview.chatId}</div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className={styles.primary}>
          Создать чат
        </button>
      </div>
    </form>
  );
}