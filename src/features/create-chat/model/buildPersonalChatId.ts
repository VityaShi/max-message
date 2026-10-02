import { normalizePhone } from 'shared/lib/phone';

export const PERSONAL_CHAT_SUFFIX = '@c.us';

export type PhoneToChatIdResult = {
  chatId: string | null;
  title: string;
  error: string | null;
};

export function buildPersonalChatId(
  rawPhone: string,
  suffix: string = PERSONAL_CHAT_SUFFIX,
): PhoneToChatIdResult {
  const normalized = normalizePhone(rawPhone);
  if (!normalized) {
    return {
      chatId: null,
      title: '',
      error:
        'Введите номер в международном формате (например, +7 999 123-45-67 или 89991234567).',
    };
  }
  return {
    chatId: `${normalized}${suffix}`,
    title: normalized,
    error: null,
  };
}