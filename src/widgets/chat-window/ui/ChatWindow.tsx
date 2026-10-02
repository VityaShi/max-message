import type { Chat, ConnectionStatus } from 'shared/types/domain';
import type { SendResult } from 'entities/chat';
import { ChatHeader } from 'widgets/chat-header';
import { MessageInput, MessageList } from 'entities/message';

export type ChatWindowProps = {
  chat: Chat;
  connectionStatus: ConnectionStatus;
  onLeave: () => void;
  onSend: (text: string) => Promise<SendResult>;
  onRetry: (messageId: string) => Promise<SendResult>;
};

export function ChatWindow({
  chat,
  connectionStatus,
  onLeave,
  onSend,
  onRetry,
}: ChatWindowProps) {
  const disabled = connectionStatus !== 'online';
  const handleSend = async (text: string) => {
    const res = await onSend(text);
    return {
      ok: res.ok,
      error: res.ok ? undefined : res.error,
    };
  };
  return (
    <>
      <ChatHeader
        title={chat.title}
        chatId={chat.chatId}
        status={connectionStatus}
        onLeave={onLeave}
      />
      <MessageList messages={chat.messages} onRetry={(id) => void onRetry(id)} />
      <MessageInput onSend={handleSend} disabled={disabled} />
    </>
  );
}