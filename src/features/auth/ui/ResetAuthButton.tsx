import { clearCredentials } from '../model/credentialsStorage';
import styles from './ResetAuthButton.module.css';

export type ResetAuthButtonProps = {
  onReset?: () => void;
  label?: string;
};

export function ResetAuthButton({
  onReset,
  label = 'Сбросить авторизацию',
}: ResetAuthButtonProps) {
  const handleClick = () => {
    clearCredentials();
    onReset?.();
  };

  return (
    <button type="button" className={styles.btn} onClick={handleClick}>
      {label}
    </button>
  );
}
