import type { Chat } from '../types/domain';
import styles from './Sidebar.module.css';

export type SidebarProps = {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  onRemove: (chatId: string) => void;
};

function initial(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0);
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mo}`;
}

function lastMessagePreview(chat: Chat): string {
  if (chat.messages.length === 0) return 'Нет сообщений';
  const last = chat.messages[chat.messages.length - 1];
  const prefix = last.direction === 'out' ? 'Вы: ' : '';
  const text = last.text.replace(/\s+/g, ' ').trim();
  return prefix + (text.length > 60 ? text.slice(0, 57) + '…' : text);
}

function lastTs(chat: Chat): number {
  if (chat.messages.length === 0) return chat.createdAt;
  return chat.messages[chat.messages.length - 1].ts;
}

export function Sidebar({
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onRemove,
}: SidebarProps) {
  const sorted = [...chats].sort((a, b) => lastTs(b) - lastTs(a));

  return (
    <aside className={styles.bar}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Чаты</h2>
        <button
          type="button"
          className={styles.newBtn}
          onClick={onNewChat}
          aria-label="Новый чат"
          title="Новый чат"
        >
          +
        </button>
      </div>
      <div className={styles.list}>
        {sorted.length === 0 ? (
          <div className={styles.empty}>
            Пока нет чатов. Нажмите «+», чтобы создать первый.
          </div>
        ) : (
          sorted.map((chat) => {
            const active = chat.chatId === activeChatId;
            return (
              <button
                key={chat.chatId}
                type="button"
                className={`${styles.item} ${active ? styles.itemActive : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <div className={styles.avatar} aria-hidden="true">
                  {initial(chat.title)}
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
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.removeBtn}
                      aria-label={`Удалить чат ${chat.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(chat.chatId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onRemove(chat.chatId);
                        }
                      }}
                    >
                      ✕
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}