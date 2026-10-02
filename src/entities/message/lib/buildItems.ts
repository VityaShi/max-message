import type { Message } from 'shared/types/domain';
import { dayKey, formatDate } from './format';

export type Item =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'msg'; msg: Message };

export function buildItems(messages: Message[]): Item[] {
  const items: Item[] = [];
  let lastDay: string | null = null;
  for (const m of messages) {
    const dk = dayKey(m.ts);
    if (dk !== lastDay) {
      items.push({ kind: 'date', key: `d-${dk}`, label: formatDate(m.ts) });
      lastDay = dk;
    }
    items.push({ kind: 'msg', msg: m });
  }
  return items;
}