import styles from './Sidebar.module.css';

export type SidebarNewChatProps = {
  onNewChat: () => void;
};

export function SidebarNewChat({ onNewChat }: SidebarNewChatProps) {
  return (
    <button
      type="button"
      className={styles.newBtn}
      onClick={onNewChat}
      aria-label="Новый чат"
      title="Новый чат"
    >
      +
    </button>
  );
}