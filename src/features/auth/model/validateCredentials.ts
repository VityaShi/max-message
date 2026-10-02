import type { Credentials } from 'shared/types/greenApi';

const ID_PATTERN = /^\d{6,12}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9._-]{10,}$/;

export type ValidationResult =
  | { ok: true; credentials: Credentials }
  | { ok: false; error: string };

export function validateCredentials(
  idInstance: string,
  apiTokenInstance: string,
): ValidationResult {
  const trimmedId = idInstance.trim();
  const trimmedToken = apiTokenInstance.trim();
  if (!ID_PATTERN.test(trimmedId)) {
    return { ok: false, error: 'idInstance должен состоять из цифр (6–12 символов).' };
  }
  if (!TOKEN_PATTERN.test(trimmedToken)) {
    return { ok: false, error: 'apiTokenInstance выглядит неверно (минимум 10 символов).' };
  }
  return {
    ok: true,
    credentials: { idInstance: trimmedId, apiTokenInstance: trimmedToken },
  };
}