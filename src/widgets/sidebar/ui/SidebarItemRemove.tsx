import type { Chat } from 'shared/types/domain';
import styles from './Sidebar.module.css';

export type SidebarItemRemoveProps = {
  chat: Chat;
  onRemove: (chatId: string) => void;
};

export function SidebarItemRemove({ chat, onRemove }: SidebarItemRemoveProps) {
  return (
    <button
      type="button"
      className={styles.removeBtn}
      aria-label={`Удалить чат ${chat.title}`}
      onClick={() => onRemove(chat.chatId)}
    >
      ✕
    </button>
  );
}