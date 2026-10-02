import type { Chat } from 'shared/types/domain';
import { chatInitial } from 'shared/lib/chatInitial';
import { formatTs, lastMessagePreview, lastTs } from '../lib/formatChatPreview';
import styles from './Sidebar.module.css';

export type SidebarItemProps = {
  chat: Chat;
  onSelect: (chatId: string) => void;
};

export function SidebarItem({ chat, onSelect }: SidebarItemProps) {
  return (
    <button
      type="button"
      className={styles.itemMain}
      onClick={() => onSelect(chat.chatId)}
    >
      <div className={styles.avatar} aria-hidden="true">
        {chatInitial(chat.title)}
      </div>
      <div className={styles.meta}>
        <div className={styles.row}>
          <span className={styles.title}>{chat.title}</span>
          <span className={styles.ts}>{formatTs(lastTs(chat))}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.preview}>
            {lastMessagePreview(chat)}
          </span>
        </div>
      </div>
    </button>
  );
}