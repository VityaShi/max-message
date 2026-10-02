import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteNotification as deleteNotificationApi,
  receiveNotification as receiveNotificationApi,
  sendMessage as sendMessageApi,
} from 'shared/api/greenApi';
import { GreenApiHttpError, isAbortError } from 'shared/api/errors';
import {
  POLL_INTERVAL_MS,
  POLL_MAX_BACKOFF_MS,
  POLL_MIN_BACKOFF_MS,
} from 'shared/config/polling';
import type { Chat, ConnectionStatus, Message, Session } from 'shared/types/domain';
import type { Notification } from 'shared/types/greenApi';
import { loadActive, loadChats, saveActive, saveChats } from './chatStorage';
import {
  deriveTitleFromChatId,
  extractDigits,
  extractPhoneFromChatId,
  findChatByDigits,
} from '../lib/chatId';
import { buildIncomingMessage, extractSenderMeta } from './mapper';

export type SendResult =
  | { ok: true; idMessage: string }
  | { ok: false; error: string };

export type UseChatsApi = {
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  send: (text: string) => Promise<SendResult>;
  retry: (messageId: string) => Promise<SendResult>;
  createChat: (chatId: string, title: string) => string;
  selectChat: (chatId: string | null) => void;
  removeChat: (chatId: string) => void;
  connectionStatus: ConnectionStatus;
};

let messageCounter = 0;
function nextId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${Date.now()}-${messageCounter}`;
}

function mergeChatsByChatId(
  prev: Chat[],
  incomingChatId: string,
  isGroup: boolean,
  matchKey: string,
  buildTitle: (existingTitle: string) => string,
  incomingMsg: Message,
): Chat[] {
  const isSameConversation = (c: Chat): boolean => {
    if (c.chatId === incomingChatId) return true;
    if (
      !isGroup &&
      matchKey.length >= 7 &&
      extractDigits(c.chatId) === matchKey
    ) {
      return true;
    }
    return false;
  };

  const matched = prev.filter(isSameConversation);
  if (matched.length === 0) {
    const newChat: Chat = {
      chatId: incomingChatId,
      title: buildTitle(deriveTitleFromChatId(incomingChatId)),
      createdAt: Date.now(),
      messages: [incomingMsg],
    };
    return [...prev, newChat];
  }

  const seenIds = new Set<string>();
  const mergedMessages: Message[] = [];
  for (const c of matched) {
    for (const m of c.messages) {
      if (seenIds.has(m.id)) continue;
      seenIds.add(m.id);
      mergedMessages.push(m);
    }
  }
  if (!seenIds.has(incomingMsg.id)) {
    mergedMessages.push(incomingMsg);
  }
  const merged: Chat = {
    chatId: incomingChatId,
    title: buildTitle(matched[0].title),
    createdAt: matched.reduce(
      (acc, c) => Math.min(acc, c.createdAt),
      Number.POSITIVE_INFINITY,
    ),
    messages: mergedMessages,
  };
  return [...prev.filter((c) => !isSameConversation(c)), merged];
}

export function useChats(session: Session | null): UseChatsApi {
  const [chats, setChats] = useState<Chat[]>(() => loadChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => loadActive(),
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');

  const sessionRef = useRef<Session | null>(session);
  const statusRef = useRef<ConnectionStatus>('idle');
  const activeChatIdRef = useRef<string | null>(activeChatId);
  const abortRef = useRef<AbortController | null>(null);
  const scheduledRef = useRef<number | null>(null);
  const backoffRef = useRef<number>(POLL_INTERVAL_MS);

  useEffect(() => {
    sessionRef.current = session;
    statusRef.current = connectionStatus;
    activeChatIdRef.current = activeChatId;
  }, [session, connectionStatus, activeChatId]);

  useEffect(() => {
    if (chats.length === 0 && activeChatId !== null) {
      // oxlint-disable-next-line react/set-state-in-effect
      setActiveChatId(null);
      saveActive(null);
      return;
    }
    if (activeChatId && !chats.some((c) => c.chatId === activeChatId)) {
      const first = chats[0]?.chatId ?? null;
      // oxlint-disable-next-line react/set-state-in-effect
      setActiveChatId(first);
      saveActive(first);
    }
  }, [chats, activeChatId]);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    saveActive(activeChatId);
  }, [activeChatId]);

  const createChat = useCallback(
    (chatId: string, title: string): string => {
      const trimmedTitle = title.trim() || deriveTitleFromChatId(chatId);
      let resolvedChatId = chatId;
      setChats((prev) => {
        const existing = prev.find((c) => c.chatId === chatId);
        if (existing) {
          const desired = deriveTitleFromChatId(chatId);
          const needsTitle =
            existing.title === desired && trimmedTitle !== desired;
          if (needsTitle) {
            return prev.map((c) =>
              c.chatId === chatId ? { ...c, title: trimmedTitle } : c,
            );
          }
          return prev;
        }
        const matchByPhone = findChatByDigits(prev, extractDigits(chatId));
        if (matchByPhone) {
          resolvedChatId = matchByPhone.chatId;
          const desired = deriveTitleFromChatId(matchByPhone.chatId);
          const needsTitle =
            matchByPhone.title === desired && trimmedTitle !== desired;
          if (needsTitle) {
            return prev.map((c) =>
              c.chatId === matchByPhone.chatId
                ? { ...c, title: trimmedTitle }
                : c,
            );
          }
          return prev;
        }
        const newChat: Chat = {
          chatId,
          title: trimmedTitle,
          createdAt: Date.now(),
          messages: [],
        };
        return [...prev, newChat];
      });
      setActiveChatId(resolvedChatId);
      return resolvedChatId;
    },
    [],
  );

  const selectChat = useCallback((chatId: string | null) => {
    setActiveChatId(chatId);
  }, []);

  const removeChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.chatId !== chatId));
  }, []);

  const handleIncoming = useCallback(
    (notification: Notification): void => {
      const incoming = buildIncomingMessage(notification);
      const meta = extractSenderMeta(notification);
      if (!incoming || !meta) return;
      const { chatId: incomingChatId, isGroup, senderDisplay, senderName, senderContactName, chatName } = meta;
      const senderPhoneRaw = notification.body.senderData?.senderPhoneNumber;
      const incomingPhone =
        !isGroup && senderPhoneRaw !== undefined && senderPhoneRaw !== null
          ? extractDigits(String(senderPhoneRaw))
          : '';
      const incomingChatDigits = extractDigits(incomingChatId);
      const incomingLocalPhone = extractPhoneFromChatId(incomingChatId);
      const matchKey = !isGroup
        ? incomingPhone.length >= 7
          ? incomingPhone
          : incomingChatDigits.length >= 7
            ? incomingChatDigits
            : ''
        : '';
      const personalTitle = (fallback: string): string =>
        (senderName.length > 0 && senderName) ||
        (senderContactName.length > 0 ? senderContactName : null) ||
        fallback;
      const groupTitle = (existing: string): string =>
        chatName.length > 0 ? chatName : existing;
      const buildTitle = (existing: string): string =>
        isGroup ? groupTitle(existing) : personalTitle(existing || senderDisplay);
      setChats((prev) =>
        mergeChatsByChatId(
          prev,
          incomingChatId,
          isGroup,
          matchKey,
          buildTitle,
          incoming,
        ),
      );

      const active = activeChatIdRef.current;
      if (active && active !== incomingChatId) {
        const sameByPhone =
          !isGroup &&
          matchKey.length >= 7 &&
          (extractDigits(active) === matchKey ||
            extractPhoneFromChatId(active) === incomingLocalPhone);
        if (sameByPhone) {
          setActiveChatId(incomingChatId);
        }
      }
    },
    [],
  );

  const runPollOnce = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    if (!current) {
      setConnectionStatus('idle');
      return;
    }
    if (!abortRef.current) {
      abortRef.current = new AbortController();
    }
    const signal = abortRef.current.signal;
    try {
      const notification = await receiveNotificationApi(current, signal);
      if (signal.aborted) return;
      if (notification === null) {
        setConnectionStatus('online');
        backoffRef.current = POLL_INTERVAL_MS;
        return;
      }
      handleIncoming(notification);
      try {
        await deleteNotificationApi(current, notification.receiptId, signal);
      } catch (err) {
        if (err instanceof GreenApiHttpError && err.status === 401) {
          console.warn(
            '[useChats] deleteNotification returned 401 (likely already cleared by server)',
          );
        } else {
          console.warn('[useChats] deleteNotification failed', err);
        }
      }
      setConnectionStatus('online');
      backoffRef.current = POLL_INTERVAL_MS;
    } catch (err) {
      if (isAbortError(err)) return;
      console.error('[useChats] poll error', err);
      const delay = backoffRef.current;
      backoffRef.current = Math.min(
        Math.max(delay * 2, POLL_MIN_BACKOFF_MS),
        POLL_MAX_BACKOFF_MS,
      );
      const isAuth = err instanceof GreenApiHttpError && err.status === 401;
      setConnectionStatus(isAuth ? 'offline' : 'reconnecting');
    }
  }, [handleIncoming]);

  useEffect(() => {
    if (!session) {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (scheduledRef.current !== null) {
        window.clearTimeout(scheduledRef.current);
        scheduledRef.current = null;
      }
      // oxlint-disable-next-line react/set-state-in-effect
      setConnectionStatus('idle');
      return;
    }
    abortRef.current = new AbortController();
    // oxlint-disable-next-line react/set-state-in-effect
    setConnectionStatus('connecting');
    backoffRef.current = POLL_INTERVAL_MS;

    const tick = async () => {
      await runPollOnce();
      if (abortRef.current?.signal.aborted) return;
      const delay =
        statusRef.current === 'online' ? POLL_INTERVAL_MS : backoffRef.current;
      scheduledRef.current = window.setTimeout(() => {
        scheduledRef.current = null;
        void tick();
      }, delay);
    };

    scheduledRef.current = window.setTimeout(() => {
      scheduledRef.current = null;
      void tick();
    }, 0);

    return () => {
      if (scheduledRef.current !== null) {
        window.clearTimeout(scheduledRef.current);
        scheduledRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [session, runPollOnce]);

  const sendInChat = useCallback(
    async (chatId: string, text: string): Promise<SendResult> => {
      const current = sessionRef.current;
      if (!current) return { ok: false, error: 'Нет подключения к GREEN-API' };
      const tempId = nextId('out');
      const optimistic: Message = {
        id: tempId,
        text,
        ts: Date.now(),
        direction: 'out',
        status: 'sending',
      };
      setChats((prev) =>
        prev.map((c) =>
          c.chatId === chatId
            ? { ...c, messages: [...c.messages, optimistic] }
            : c,
        ),
      );
      try {
        const res = await sendMessageApi(
          current,
          { chatId, message: text },
          abortRef.current?.signal,
        );
        setChats((prev) =>
          prev.map((c) =>
            c.chatId !== chatId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId
                      ? { ...m, id: res.idMessage, status: 'sent' as const }
                      : m,
                  ),
                },
          ),
        );
        return { ok: true, idMessage: res.idMessage };
      } catch (err) {
        if (isAbortError(err)) {
          return { ok: false, error: 'Отправка отменена' };
        }
        console.error('[useChats] sendMessage failed', err);
        const message =
          err instanceof GreenApiHttpError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Не удалось отправить';
        setChats((prev) =>
          prev.map((c) =>
            c.chatId !== chatId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId
                      ? { ...m, status: 'failed' as const }
                      : m,
                  ),
                },
          ),
        );
        return { ok: false, error: message };
      }
    },
    [],
  );

  const send = useCallback(
    async (text: string): Promise<SendResult> => {
      const trimmed = text.trim();
      if (!trimmed) return { ok: false, error: 'Пустое сообщение' };
      if (!activeChatId) return { ok: false, error: 'Чат не выбран' };
      return sendInChat(activeChatId, trimmed);
    },
    [activeChatId, sendInChat],
  );

  const retry = useCallback(
    async (messageId: string): Promise<SendResult> => {
      if (!activeChatId) return { ok: false, error: 'Чат не выбран' };
      const targetChat = chats.find((c) => c.chatId === activeChatId);
      const target = targetChat?.messages.find((m) => m.id === messageId);
      if (!target || target.direction !== 'out') {
        return { ok: false, error: 'Сообщение не найдено' };
      }
      setChats((prev) =>
        prev.map((c) =>
          c.chatId !== activeChatId
            ? c
            : { ...c, messages: c.messages.filter((m) => m.id !== messageId) },
        ),
      );
      const result = await sendInChat(activeChatId, target.text);
      if (!result.ok) {
        setChats((prev) =>
          prev.map((c) =>
            c.chatId !== activeChatId
              ? c
              : {
                  ...c,
                  messages: [
                    ...c.messages,
                    { ...target, id: nextId('out'), status: 'failed' as const },
                  ],
                },
          ),
        );
      }
      return result;
    },
    [activeChatId, chats, sendInChat],
  );

  const activeChat = useMemo(
    () =>
      activeChatId
        ? (chats.find((c) => c.chatId === activeChatId) ?? null)
        : null,
    [chats, activeChatId],
  );

  return {
    chats,
    activeChatId,
    activeChat,
    send,
    retry,
    createChat,
    selectChat,
    removeChat,
    connectionStatus,
  };
}