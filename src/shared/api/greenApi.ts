import type {
  Credentials,
  Notification,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/greenApi';
import { GREEN_API_BASE_URL } from '../config/api';
import { GreenApiHttpError } from './errors';

function buildUrl(creds: Credentials, path: string): string {
  return `${GREEN_API_BASE_URL}/waInstance${creds.idInstance}${path}/${creds.apiTokenInstance}`;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!res.ok) {
    const msg =
      (typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : null) ??
      (typeof payload === 'object' && payload !== null && 'error' in payload
        ? String((payload as { error?: unknown }).error)
        : null) ??
      `HTTP ${res.status}`;
    console.error('[greenApi] request failed', res.status, payload);
    throw new GreenApiHttpError(res.status, msg);
  }
  return payload as T;
}

export async function sendMessage(
  creds: Credentials,
  body: SendMessageRequest,
  signal?: AbortSignal,
): Promise<SendMessageResponse> {
  const url = buildUrl(creds, '/sendMessage');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  return parseOrThrow<SendMessageResponse>(res);
}

export async function receiveNotification(
  creds: Credentials,
  signal?: AbortSignal,
): Promise<Notification | null> {
  const url = buildUrl(creds, '/receiveNotification');
  const res = await fetch(url, { method: 'GET', signal });
  return parseOrThrow<Notification | null>(res);
}

export async function deleteNotification(
  creds: Credentials,
  receiptId: number,
  signal?: AbortSignal,
): Promise<void> {
  // deleteNotification is the only endpoint with the API token in the middle:
  // /waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}
  const url = `${GREEN_API_BASE_URL}/waInstance${creds.idInstance}/deleteNotification/${creds.apiTokenInstance}/${receiptId}`;
  const res = await fetch(url, { method: 'DELETE', signal });
  await parseOrThrow<unknown>(res);
}