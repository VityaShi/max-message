import type { Chat } from 'shared/types/domain';

const STORAGE_CHATS = 'max-chat:chats';
const STORAGE_ACTIVE = 'max-chat:active';

function isChat(value: unknown): value is Chat {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Chat).chatId === 'string' &&
    typeof (value as Chat).title === 'string' &&
    typeof (value as Chat).createdAt === 'number' &&
    Array.isArray((value as Chat).messages)
  );
}

export function loadChats(): Chat[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_CHATS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChat);
  } catch {
    return [];
  }
}

export function loadActive(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_ACTIVE);
  } catch {
    return null;
  }
}

export function saveChats(chats: Chat[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_CHATS, JSON.stringify(chats));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function saveActive(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id === null) window.localStorage.removeItem(STORAGE_ACTIVE);
    else window.localStorage.setItem(STORAGE_ACTIVE, id);
  } catch {
    /* ignore */
  }
}