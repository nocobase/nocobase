/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const kanbanRecord = Symbol('kanbanRecord');
export const kanbanMoveKey = Symbol('kanbanMoveKey');

export function isCardMoveDisabled(card) {
  return card && kanbanRecord in card && card[kanbanMoveKey] === undefined;
}

export function getCardDragId(card) {
  return isCardMoveDisabled(card) ? `unavailable:${card.id}` : `card:${card.id}`;
}

type RecordKey = string | number;
type MoveKey = RecordKey | Record<string, RecordKey>;
type BoardRecord = Record<string, RecordKey>;
type Group = { value: RecordKey; label: string; color?: string };
type Column = {
  id: RecordKey;
  title: string;
  color?: string;
  cards: Array<{
    id: RecordKey;
    [kanbanRecord]: BoardRecord;
    [kanbanMoveKey]: MoveKey;
  }>;
};

export function toColumns(
  groupField: { name: string },
  records: BoardRecord[] = [],
  targetKey: string | string[] = 'id',
  options: Group[] = [],
) {
  const columns: Record<string, Column> = Object.create(null);
  columns.__unknown__ = { id: '__unknown__', title: 'Unknown', color: 'default', cards: [] };
  for (const { value, label, color } of options) {
    columns[value] = { id: value, title: label, color, cards: [] };
  }

  const keys = records.map((record) => {
    if (!Array.isArray(targetKey)) return record[targetKey];
    if (!targetKey.length || targetKey.some((key) => record[key] == null || record[key] === '')) return undefined;
    return Object.fromEntries(targetKey.map((key) => [key, record[key]]));
  });
  const ids = keys.map((key) => (typeof key === 'object' ? JSON.stringify(key) : key));
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(String(id), (counts.get(String(id)) ?? 0) + 1);

  records.forEach((record, index) => {
    const id = ids[index];
    const unavailable = id == null || id === '' || counts.get(String(id)) > 1;
    const column = columns[record[groupField.name]] || columns.__unknown__;
    column.cards.push({
      ...record,
      id: unavailable ? index : id,
      [kanbanRecord]: record,
      [kanbanMoveKey]: unavailable ? undefined : keys[index],
    });
  });
  if (!columns.__unknown__.cards.length) delete columns.__unknown__;
  return Object.values(columns);
}
