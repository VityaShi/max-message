import { useCallback } from 'react';

export type UseRemoveChatResult = {
  remove: (chatId: string) => void;
  confirm: (chatId: string) => void;
};

export function useRemoveChat(removeChat: (chatId: string) => void): UseRemoveChatResult {
  const remove = useCallback((chatId: string) => removeChat(chatId), [removeChat]);
  const confirm = useCallback(
    (chatId: string) => {
      if (typeof window !== 'undefined' && !window.confirm('Удалить этот чат?')) {
        return;
      }
      removeChat(chatId);
    },
    [removeChat],
  );
  return { remove, confirm };
}