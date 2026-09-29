import { useMemo, useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { ChatForm } from './components/ChatForm';
import { ChatHeader } from './components/ChatHeader';
import { MessageInput } from './components/MessageInput';
import { MessageList } from './components/MessageList';
import { SettingsBanner } from './components/SettingsBanner';
import { Sidebar } from './components/Sidebar';
import { useChats } from './hooks/useChats';
import type { Credentials } from './types/greenApi';
import type { ConnectionStatus, Session } from './types/domain';
import styles from './App.module.css';

function statusToast(status: ConnectionStatus): string | null {
  switch (status) {
    case 'reconnecting':
      return 'Нет соединения, пробуем снова…';
    case 'offline':
      return 'Не удаётся получить сообщения от GREEN-API.';
    default:
      return null;
  }
}

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
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
    settingsStatus,
    settingsError,
    send,
    retry,
    createChat,
    selectChat,
    removeChat,
    applyHttpApiSettings,
  } = useChats(session);

  const toast = statusToast(connectionStatus);

  const handleAuth = (creds: Credentials) => {
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

  const handleNewChatClick = () => {
    setShowNewChatForm(true);
  };

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    setShowNewChatForm(false);
  };

  const handleRemoveChat = (chatId: string) => {
    if (window.confirm('Удалить этот чат?')) {
      removeChat(chatId);
    }
  };

  const screen: 'auth' | 'workspace' = !credentials ? 'auth' : 'workspace';

  return (
    <div className={styles.app}>
      {toast && <div className={styles.toast}>{toast}</div>}

      {screen === 'auth' && (
        <div className={styles.center}>
          <AuthForm onSubmit={handleAuth} />
        </div>
      )}

      {screen === 'workspace' && credentials && (
        <div className={styles.workspace}>
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelect={handleSelectChat}
            onNewChat={handleNewChatClick}
            onRemove={handleRemoveChat}
          />

          <div className={styles.chatPanel}>
            <SettingsBanner
              status={settingsStatus}
              error={settingsError}
              onApply={applyHttpApiSettings}
            />

            {showNewChatForm ? (
              <div className={styles.center}>
                <ChatForm
                  onSubmit={handleCreateChat}
                  onCancel={() => setShowNewChatForm(false)}
                />
              </div>
            ) : activeChat ? (
              <>
                <ChatHeader
                  title={activeChat.title}
                  chatId={activeChat.chatId}
                  status={connectionStatus}
                  onLeave={() => selectChat(null)}
                />
                <MessageList
                  messages={activeChat.messages}
                  onRetry={retry}
                />
                <MessageInput
                  onSend={async (text) => {
                    const res = await send(text);
                    return {
                      ok: res.ok,
                      error: res.ok ? undefined : res.error,
                    };
                  }}
                />
              </>
            ) : (
              <div className={styles.emptyChat}>
                <div>
                  <strong>Выберите чат</strong>
                  или создайте новый, нажав «+» слева.
                  <br />
                  <button
                    type="button"
                    onClick={handleResetAuth}
                    style={{
                      marginTop: 16,
                      background: 'transparent',
                      border: '1px solid #2f2f34',
                      color: '#c4c4c8',
                      padding: '6px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    Сбросить авторизацию
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}