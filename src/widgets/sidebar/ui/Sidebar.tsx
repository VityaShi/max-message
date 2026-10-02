import { useMemo } from 'react';
import type { Chat } from 'shared/types/domain';
import { lastTs } from '../lib/formatChatPreview';
import { SidebarItem } from './SidebarItem';
import { SidebarItemRemove } from './SidebarItemRemove';
import { SidebarNewChat } from './SidebarNewChat';
import styles from './Sidebar.module.css';

export type SidebarProps = {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  onRemove: (chatId: string) => void;
};

export function Sidebar({
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onRemove,
}: SidebarProps) {
  const sorted = useMemo(
    () => [...chats].sort((a, b) => lastTs(b) - lastTs(a)),
    [chats],
  );

  return (
    <aside className={styles.bar}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Чаты</h2>
        <SidebarNewChat onNewChat={onNewChat} />
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
              <div
                key={chat.chatId}
                className={`${styles.itemRow} ${active ? styles.itemActive : ''}`}
              >
                <SidebarItem chat={chat} onSelect={onSelect} />
                <SidebarItemRemove chat={chat} onRemove={onRemove} />
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}