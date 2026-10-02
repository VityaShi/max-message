/**
 * Первая «видимая» буква заголовка чата для аватарки.
 * - пропускает ведущий «+» у телефонных номеров: `+7 999…` → `7`
 * - возвращает `?` для пустой/пробельной строки
 */
export function chatInitial(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '?';
  return trimmed.replace(/^\+?/, '').charAt(0);
}