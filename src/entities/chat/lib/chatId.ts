import type { Chat } from 'shared/types/domain';

export function extractPhoneFromChatId(chatId: string): string {
  const at = chatId.indexOf('@');
  const local = at === -1 ? chatId : chatId.slice(0, at);
  const colon = local.indexOf(':');
  return colon === -1 ? local : local.slice(0, colon);
}

export function extractDigits(input: string): string {
  return input.replace(/\D+/g, '');
}

export function deriveTitleFromChatId(chatId: string): string {
  return extractPhoneFromChatId(chatId);
}

export function isGroupChatId(chatId: string): boolean {
  return chatId.includes('@g.us');
}

export function isGroupChat(chatId: string, chatType?: string): boolean {
  return chatType === 'group' || chatType === 'groupChat' || isGroupChatId(chatId);
}

export function findChatByDigits(chats: Chat[], digits: string): Chat | null {
  if (digits.length < 7) return null;
  return chats.find((c) => extractDigits(c.chatId) === digits) ?? null;
}