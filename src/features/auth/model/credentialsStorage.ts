import type { Credentials } from 'shared/types/greenApi';

const STORAGE_KEY = 'max-chat:credentials';

function isCredentials(value: unknown): value is Credentials {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Credentials).idInstance === 'string' &&
    typeof (value as Credentials).apiTokenInstance === 'string' &&
    (value as Credentials).idInstance.length > 0 &&
    (value as Credentials).apiTokenInstance.length > 0
  );
}

export function loadCredentials(): Credentials | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isCredentials(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function clearCredentials(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}