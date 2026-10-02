import type { ConnectionStatus } from 'shared/types/domain';

export function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'connecting':
      return 'подключение…';
    case 'online':
      return 'в сети';
    case 'reconnecting':
      return 'переподключение…';
    case 'offline':
      return 'нет соединения';
    default:
      return '';
  }
}