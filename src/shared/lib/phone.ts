/**
 * Нормализует телефон в международный формат для GREEN-API (chatId).
 * - `+79991234567` → `79991234567`
 * - `89991234567` → `79991234567` (8 заменяется на 7, РФ-конвенция)
 * - `+1 555 123 4567` → `15551234567`
 * - `79991234567` → `79991234567`
 */
export function normalizePhone(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  // Российская конвенция: 8XXXXXXXXXX → 7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  if (digits.length < 7 || digits.length > 15) return null;
  if (!/^\d+$/.test(digits)) return null;
  return digits;
}