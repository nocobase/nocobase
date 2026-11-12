/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getCardDragId, isCardMoveDisabled, kanbanMoveKey, kanbanRecord, toColumns } from '../board/kanbanRecord';

describe('kanban card identity', () => {
  const group = { name: 'progress' };
  const options = [{ value: 'open', label: 'Open' }];

  it('uses the same record identifier in named and ungrouped columns while preserving the physical id', () => {
    const records = [
      { id: 100, code: '11', progress: 'open' },
      { id: 101, code: '1' },
    ];
    const columns = toColumns(group, records, 'code', options);
    const cards = columns.flatMap((column) => column.cards);
    expect(new Set(cards.map(getCardDragId)).size).toBe(2);
    expect(cards.map((card) => [card[kanbanMoveKey], card[kanbanRecord].id])).toEqual([
      ['1', 101],
      ['11', 100],
    ]);
    expect(cards.some(isCardMoveDisabled)).toBe(false);
  });

  it('gives ambiguous records separate render identities and disables only those moves', () => {
    const records = [{ code: 0 }, { code: 'dup' }, { code: 'dup', progress: 'open' }, {}];
    const cards = toColumns(group, records, 'code', options).flatMap((column) => column.cards);
    expect(new Set(cards.map(getCardDragId)).size).toBe(records.length);
    expect(cards.filter((card) => !isCardMoveDisabled(card)).map((card) => card[kanbanMoveKey])).toEqual([0]);
  });
});
