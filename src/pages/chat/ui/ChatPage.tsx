import { useMemo, useState } from 'react';
import type { Credentials } from 'shared/types/greenApi';
import type { Session } from 'shared/types/domain';
import { useChats } from 'entities/chat';
import { useRemoveChat } from 'features/remove-chat';
import {
  AuthForm,
  ResetAuthButton,
  loadCredentials,
  saveCredentials,
} from 'features/auth';
import { ChatForm } from 'features/create-chat';
import { ChatWindow } from 'widgets/chat-window';
import { Sidebar } from 'widgets/sidebar';
import { Toast } from 'widgets/toast';
import styles from './ChatPage.module.css';

export function ChatPage() {
  const [credentials, setCredentials] = useState<Credentials | null>(
    () => loadCredentials(),
  );
  const [showNewChatForm, setShowNewChatForm] = useState(false);

  const session: Session | null = useMemo(() => {
    if (!credentials) return null;
    return {
      idInstance: credentials.idInstance,
      apiTokenInstance: credentials.apiTokenInstance,
    };
  }, [credentials]);

  const {
    chats,
    activeChatId,
    connectionStatus,
    activeChat,
    send,
    retry,
    createChat,
    selectChat,
    removeChat,
  } = useChats(session);

  const { confirm: confirmRemove } = useRemoveChat(removeChat);

  const handleAuth = (creds: Credentials) => {
    saveCredentials(creds);
    setCredentials(creds);
  };
  const handleResetAuth = () => {
    setCredentials(null);
    setShowNewChatForm(false);
  };
  const handleCreateChat = (chatId: string, title: string) => {
    createChat(chatId, title);
    setShowNewChatForm(false);
  };
  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    setShowNewChatForm(false);
  };

  if (!credentials) {
    return (
      <div className={styles.app}>
        <Toast status="idle" />
        <div className={styles.center}>
          <AuthForm onSubmit={handleAuth} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Toast status={connectionStatus} />
      <div className={styles.workspace}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelect={handleSelectChat}
          onNewChat={() => setShowNewChatForm(true)}
          onRemove={confirmRemove}
        />
        <div className={styles.chatPanel}>
          {showNewChatForm ? (
            <div className={styles.center}>
              <ChatForm
                onSubmit={handleCreateChat}
                onCancel={() => setShowNewChatForm(false)}
              />
            </div>
          ) : activeChat ? (
            <ChatWindow
              chat={activeChat}
              connectionStatus={connectionStatus}
              onLeave={() => selectChat(null)}
              onSend={send}
              onRetry={retry}
            />
          ) : (
            <div className={styles.emptyChat}>
              <div>
                <strong>Выберите чат</strong>
                или создайте новый, нажав «+» слева.
                <br />
                <ResetAuthButton onReset={handleResetAuth} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}