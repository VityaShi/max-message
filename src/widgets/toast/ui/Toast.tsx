import type { ConnectionStatus } from 'shared/types/domain';
import { connectionToast } from 'shared/lib/connection/statusMessage';

export type ToastProps = {
  status: ConnectionStatus;
};

export function Toast({ status }: ToastProps) {
  const toast = connectionToast(status);
  if (!toast) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background:
          toast.kind === 'offline' ? '#3a1a1a' : 'rgba(40, 40, 45, 0.95)',
        color: toast.kind === 'offline' ? '#ff8a80' : '#f5f5f7',
        padding: '8px 14px',
        borderRadius: 10,
        fontSize: 13,
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {toast.message}
    </div>
  );
}