import type { Message } from 'shared/types/domain';
import type { Notification } from 'shared/types/greenApi';
import { deriveTitleFromChatId, isGroupChat } from '../lib/chatId';

let messageCounter = 0;
function nextId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${Date.now()}-${messageCounter}`;
}

export function buildIncomingMessage(n: Notification): Message | null {
  const { body } = n;
  if (
    body.typeWebhook !== 'incomingMessageReceived' ||
    body.messageData?.typeMessage !== 'textMessage' ||
    !body.messageData.textMessageData ||
    !body.senderData?.chatId
  ) {
    return null;
  }
  return {
    id: body.idMessage ?? nextId('in'),
    text: body.messageData.textMessageData.textMessage,
    ts: Date.now(),
    direction: 'in',
    status: 'sent',
  };
}

export type SenderMeta = {
  chatId: string;
  isGroup: boolean;
  chatName: string;
  senderName: string;
  senderContactName: string;
  senderDisplay: string;
};

export function extractSenderMeta(n: Notification): SenderMeta | null {
  const { body } = n;
  if (!body.senderData?.chatId) return null;
  const incomingChatId = body.senderData.chatId;
  const senderName = body.senderData.senderName?.trim() ?? '';
  const senderContactName = body.senderData.senderContactName?.trim() ?? '';
  const chatName = body.senderData.chatName?.trim() ?? '';
  const sender = body.senderData.sender?.trim() ?? '';
  const isGroup = isGroupChat(incomingChatId, body.senderData.chatType);
  return {
    chatId: incomingChatId,
    isGroup,
    chatName,
    senderName,
    senderContactName,
    senderDisplay: sender || deriveTitleFromChatId(incomingChatId),
  };
}