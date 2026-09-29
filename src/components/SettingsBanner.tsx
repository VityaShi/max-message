import type { SettingsStatus } from '../hooks/useChats';
import styles from './SettingsBanner.module.css';

export type SettingsBannerProps = {
  status: SettingsStatus;
  error: string | null;
  onApply: () => Promise<void>;
};

function statusCopy(
  status: SettingsStatus,
  error: string | null,
): { title: string; detail: string; show: boolean; errorMode: boolean } {
  switch (status) {
    case 'checking':
      return {
        title: 'Проверяем настройки GREEN-API…',
        detail: 'Запрашиваем текущие параметры инстанса.',
        show: true,
        errorMode: false,
      };
    case 'applying':
      return {
        title: 'Включаем входящие уведомления…',
        detail:
          'Без этого receiveNotification всегда возвращает null. Это разовая настройка.',
        show: true,
        errorMode: false,
      };
    case 'failed':
      return {
        title: 'Не удалось включить входящие уведомления',
        detail:
          error ??
          'Откройте консоль GREEN-API и поставьте incomingWebhook=yes, webhookUrl="".',
        show: true,
        errorMode: true,
      };
    case 'ready':
      return { title: '', detail: '', show: false, errorMode: false };
    case 'idle':
    default:
      return { title: '', detail: '', show: false, errorMode: false };
  }
}

export function SettingsBanner({
  status,
  error,
  onApply,
}: SettingsBannerProps) {
  const copy = statusCopy(status, error);
  const className = `${styles.banner} ${copy.errorMode ? styles.bannerError : ''} ${copy.show ? '' : styles.bannerHidden}`;
  const showSpinner = status === 'checking' || status === 'applying';

  return (
    <div className={className} role="status">
      {showSpinner ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {copy.errorMode ? (
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      )}
      <div className={styles.text}>
        <div className={styles.title}>{copy.title}</div>
        {copy.detail && <div className={styles.detail}>{copy.detail}</div>}
      </div>
      {copy.errorMode && (
        <button
          type="button"
          className={styles.action}
          onClick={() => void onApply()}
        >
          Повторить
        </button>
      )}
    </div>
  );
}