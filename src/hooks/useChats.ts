import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteNotification,
  getSettings,
  GreenApiHttpError,
  receiveNotification,
  sendMessage,
  setSettings,
} from '../api/greenApi';
import type { Chat, ConnectionStatus, Message, Session } from '../types/domain';

const POLL_INTERVAL_MS = 3000;
const POLL_MIN_BACKOFF_MS = 5000;
const POLL_MAX_BACKOFF_MS = 30000;

const STORAGE_CHATS = 'max-chat:chats';
const STORAGE_ACTIVE = 'max-chat:active';

type SendResult = { ok: true; idMessage: string } | { ok: false; error: string };

export type SettingsStatus =
  | 'idle'
  | 'checking'
  | 'applying'
  | 'ready'
  | 'failed';

export type UseChatsApi = {
  chats: Chat[];
  activeChatId: string | null;
  connectionStatus: ConnectionStatus;
  activeChat: Chat | null;
  settingsStatus: SettingsStatus;
  settingsError: string | null;
  send: (text: string) => Promise<SendResult>;
  retry: (messageId: string) => Promise<SendResult>;
  createChat: (chatId: string, title: string) => string;
  selectChat: (chatId: string | null) => void;
  removeChat: (chatId: string) => void;
  applyHttpApiSettings: () => Promise<void>;
};

let messageCounter = 0;
const nextId = (prefix: string): string => {
  messageCounter += 1;
  return `${prefix}-${Date.now()}-${messageCounter}`;
};

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function loadChats(): Chat[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_CHATS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (c): c is Chat =>
        typeof c === 'object' &&
        c !== null &&
        typeof (c as Chat).chatId === 'string' &&
        typeof (c as Chat).title === 'string' &&
        typeof (c as Chat).createdAt === 'number' &&
        Array.isArray((c as Chat).messages),
    );
  } catch {
    return [];
  }
}

function loadActive(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_ACTIVE);
  } catch {
    return null;
  }
}

function saveChats(chats: Chat[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_CHATS, JSON.stringify(chats));
  } catch {
    /* quota exceeded — ignore */
  }
}

function saveActive(id: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (id === null) window.localStorage.removeItem(STORAGE_ACTIVE);
    else window.localStorage.setItem(STORAGE_ACTIVE, id);
  } catch {
    /* ignore */
  }
}

function deriveTitleFromChatId(chatId: string): string {
  return extractPhoneFromChatId(chatId);
}

function extractPhoneFromChatId(chatId: string): string {
  const at = chatId.indexOf('@');
  const local = at === -1 ? chatId : chatId.slice(0, at);
  const colon = local.indexOf(':');
  return colon === -1 ? local : local.slice(0, colon);
}

function extractDigits(input: string): string {
  return input.replace(/\D+/g, '');
}

function isGroupChatId(chatId: string): boolean {
  return chatId.includes('@g.us');
}

function isGroupChat(chatId: string, chatType?: string): boolean {
  return chatType === 'group' || chatType === 'groupChat' || isGroupChatId(chatId);
}

export function useChats(session: Session | null): UseChatsApi {
  const [chats, setChats] = useState<Chat[]>(() => loadChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(
    () => loadActive(),
  );
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle');
  const [settingsStatus, setSettingsStatus] = useState<SettingsStatus>('idle');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(session);
  const statusRef = useRef<ConnectionStatus>('idle');
  const activeChatIdRef = useRef<string | null>(activeChatId);
  const abortRef = useRef<AbortController | null>(null);
  const scheduledRef = useRef<number | null>(null);
  const backoffRef = useRef<number>(POLL_INTERVAL_MS);
  const settingsAppliedRef = useRef<boolean>(false);

  useEffect(() => {
    sessionRef.current = session;
    statusRef.current = connectionStatus;
    activeChatIdRef.current = activeChatId;
  }, [session, connectionStatus, activeChatId]);

  const applyHttpApiSettings = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    if (!current) return;
    setSettingsStatus('checking');
    setSettingsError(null);
    try {
      const currentSettings = await getSettings(current);
      const needsIncoming = currentSettings.incomingWebhook !== 'yes';
      const hasWebhookUrl =
        typeof currentSettings.webhookUrl === 'string' &&
        currentSettings.webhookUrl !== '';
      if (!needsIncoming && !hasWebhookUrl) {
        setSettingsStatus('ready');
        return;
      }
      setSettingsStatus('applying');
      // GREEN-API setSettings returns { saveSettings: true } — not the full
      // settings object — so we trust the success flag and verify with a
      // follow-up getSettings call.
      await setSettings(current, {
        ...currentSettings,
        incomingWebhook: 'yes',
        outgoingWebhook: currentSettings.outgoingWebhook ?? 'no',
        webhookUrl: '',
        webhookUrlToken: '',
      });
      const verified = await getSettings(current);
      const ok =
        verified.incomingWebhook === 'yes' &&
        (!verified.webhookUrl || verified.webhookUrl === '');
      if (!ok) {
        setSettingsStatus('failed');
        setSettingsError(
          `Сохранено, но проверка вернула incomingWebhook=${
            verified.incomingWebhook ?? '?'
          }, webhookUrl=${JSON.stringify(verified.webhookUrl)}`,
        );
        return;
      }
      setSettingsStatus('ready');
    } catch (err) {
      console.error('[useChats] applyHttpApiSettings failed', err);
      setSettingsStatus('failed');
      setSettingsError(
        err instanceof GreenApiHttpError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Не удалось применить настройки GREEN-API',
      );
    }
  }, []);

  useEffect(() => {
    if (!session) {
      settingsAppliedRef.current = false;
      // oxlint-disable-next-line react/set-state-in-effect
      setSettingsStatus('idle');
      // oxlint-disable-next-line react/set-state-in-effect
      setSettingsError(null);
      return;
    }
    if (settingsAppliedRef.current) return;
    settingsAppliedRef.current = true;
    void applyHttpApiSettings();
  }, [session, applyHttpApiSettings]);

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
      const incomingDigits = extractDigits(chatId);
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
        if (incomingDigits.length >= 7) {
          const matchByPhone = prev.find(
            (c) => extractDigits(c.chatId) === incomingDigits,
          );
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

  const clearScheduled = useCallback(() => {
    if (scheduledRef.current !== null) {
      window.clearTimeout(scheduledRef.current);
      scheduledRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearScheduled();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [clearScheduled]);

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
      const notification = await receiveNotification(current, signal);
      if (signal.aborted) return;
      if (notification === null) {
        setConnectionStatus('online');
        backoffRef.current = POLL_INTERVAL_MS;
        return;
      }
      const { receiptId, body } = notification;
      if (
        body.typeWebhook === 'incomingMessageReceived' &&
        body.messageData?.typeMessage === 'textMessage' &&
        body.messageData.textMessageData &&
        body.senderData?.chatId
      ) {
        const incomingChatId = body.senderData.chatId;
        const incoming: Message = {
          id: body.idMessage ?? nextId('in'),
          text: body.messageData.textMessageData.textMessage,
          ts: Date.now(),
          direction: 'in',
          status: 'sent',
        };
        const senderName = body.senderData?.senderName?.trim();
        const senderContactName = body.senderData?.senderContactName?.trim();
        const chatName = body.senderData?.chatName?.trim();
        const chatType = body.senderData?.chatType;
        const isGroup = isGroupChat(incomingChatId, chatType);
        const senderPhoneRaw = body.senderData?.senderPhoneNumber;
        const incomingPhone =
          !isGroup && senderPhoneRaw !== undefined && senderPhoneRaw !== null
            ? extractDigits(String(senderPhoneRaw))
            : '';
        const incomingChatDigits = extractDigits(incomingChatId);
        const incomingLocalPhone = extractPhoneFromChatId(incomingChatId);
        console.info('[useChats] incoming message', {
          incomingChatId,
          incomingChatDigits,
          chatType,
          isGroup,
          chatName,
          senderPhoneRaw,
          incomingPhone,
          incomingLocalPhone,
          senderName,
          senderContactName,
          sender: body.senderData?.sender,
        });
        const matchKey = !isGroup
          ? incomingPhone.length >= 7
            ? incomingPhone
            : incomingChatDigits.length >= 7
              ? incomingChatDigits
              : ''
          : '';
        const personalTitleFallback = (): string =>
          body.senderData?.sender?.trim() ||
          deriveTitleFromChatId(incomingChatId);
        const personalTitle = (fallback: string): string =>
          (senderName && senderName.length > 0 && senderName) ||
          (senderContactName && senderContactName.length > 0
            ? senderContactName
            : null) ||
          fallback;
        const groupTitle = (existingTitle: string): string =>
          chatName && chatName.length > 0 ? chatName : existingTitle;
        setChats((prev) => {
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
            const title = isGroup
              ? chatName && chatName.length > 0
                ? chatName
                : deriveTitleFromChatId(incomingChatId)
              : personalTitle(personalTitleFallback());
            return [
              ...prev,
              {
                chatId: incomingChatId,
                title,
                createdAt: Date.now(),
                messages: [incoming],
              },
            ];
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
          if (!seenIds.has(incoming.id)) {
            mergedMessages.push(incoming);
          }
          const newTitle = isGroup
            ? groupTitle(matched[0].title)
            : personalTitle(matched[0].title);
          const earliestCreated = matched.reduce(
            (acc, c) => Math.min(acc, c.createdAt),
            Number.POSITIVE_INFINITY,
          );
          const merged: Chat = {
            chatId: incomingChatId,
            title: newTitle,
            createdAt: earliestCreated,
            messages: mergedMessages,
          };
          return [...prev.filter((c) => !isSameConversation(c)), merged];
        });
        if (
          activeChatIdRef.current &&
          (activeChatIdRef.current === incomingChatId ||
            (!isGroup &&
              matchKey.length >= 7 &&
              (extractDigits(activeChatIdRef.current) === matchKey ||
                extractPhoneFromChatId(activeChatIdRef.current) ===
                  incomingLocalPhone))) &&
          activeChatIdRef.current !== incomingChatId
        ) {
          // oxlint-disable-next-line react/set-state-in-effect
          setActiveChatId(incomingChatId);
        }
      }
      if (!signal.aborted) {
        try {
          await deleteNotification(current, receiptId, signal);
        } catch (err) {
          // GREEN-API often returns 401 for receipts that have already been
          // removed server-side; this is benign — the next poll will fetch a
          // fresh notification. Log once and move on without spamming.
          if (err instanceof GreenApiHttpError && err.status === 401) {
            console.warn(
              '[useChats] deleteNotification returned 401 (likely already cleared by server)',
            );
          } else {
            console.warn('[useChats] deleteNotification failed', err);
          }
        }
      }
      setConnectionStatus('online');
      backoffRef.current = POLL_INTERVAL_MS;
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      console.error('[useChats] poll error', err);
      const delay = backoffRef.current;
      backoffRef.current = Math.min(
        Math.max(delay * 2, POLL_MIN_BACKOFF_MS),
        POLL_MAX_BACKOFF_MS,
      );
      const isAuth = err instanceof GreenApiHttpError && err.status === 401;
      setConnectionStatus(isAuth ? 'offline' : 'reconnecting');
    }
  }, []);

  useEffect(() => {
    if (!session) {
      stop();
      return;
    }
    stop();
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
      stop();
    };
  }, [session, runPollOnce, stop]);

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
        const res = await sendMessage(
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

  const activeChat = activeChatId
    ? (chats.find((c) => c.chatId === activeChatId) ?? null)
    : null;

  return {
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
  };
}