import { useState, type FormEvent } from 'react';
import styles from './AuthForm.module.css';

export type AuthFormProps = {
  onSubmit: (creds: { idInstance: string; apiTokenInstance: string }) => void;
};

const ID_PATTERN = /^\d{6,12}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9._-]{10,}$/;

export function AuthForm({ onSubmit }: AuthFormProps) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedId = idInstance.trim();
    const trimmedToken = apiTokenInstance.trim();
    if (!ID_PATTERN.test(trimmedId)) {
      setError('idInstance должен состоять из цифр (6–12 символов).');
      return;
    }
    if (!TOKEN_PATTERN.test(trimmedToken)) {
      setError('apiTokenInstance выглядит неверно (минимум 10 символов).');
      return;
    }
    setError(null);
    onSubmit({ idInstance: trimmedId, apiTokenInstance: trimmedToken });
  };

  return (
    <form className={styles.wrap} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>MAX-чат</h1>
      <p className={styles.subtitle}>Войдите через GREEN-API</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="idInstance">
          idInstance
        </label>
        <input
          id="idInstance"
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="например, 1103xxxxxx"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="apiTokenInstance">
          apiTokenInstance
        </label>
        <input
          id="apiTokenInstance"
          className={styles.input}
          type="text"
          autoComplete="off"
          placeholder="токен из личного кабинета"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button type="submit" className={styles.button}>
        Подключиться
      </button>

      <div className={styles.hint}>
        Получите <strong>idInstance</strong> и <strong>apiTokenInstance</strong>{' '}
        в{' '}
        <a
          href="https://console.green-api.com"
          target="_blank"
          rel="noreferrer noopener"
        >
          консоли GREEN-API
        </a>
        . Перед первым подключением отсканируйте QR-код в MAX — приложение не
        делает это за вас.
      </div>
    </form>
  );
}