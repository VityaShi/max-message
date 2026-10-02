import type { ConnectionStatus } from 'shared/types/domain';

export type ConnectionToast =
  | { kind: 'reconnecting'; message: string }
  | { kind: 'offline'; message: string }
  | null;

const RECONNECTING = 'Нет соединения, пробуем снова…';
const OFFLINE = 'Не удаётся получить сообщения от GREEN-API.';

export function connectionToast(status: ConnectionStatus): ConnectionToast {
  switch (status) {
    case 'reconnecting':
      return { kind: 'reconnecting', message: RECONNECTING };
    case 'offline':
      return { kind: 'offline', message: OFFLINE };
    default:
      return null;
  }
}