/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import { upsertKanbanCollectionFieldOptions } from '../models/components/KanbanCreateSortFieldSelect';

describe('KanbanCreateSortFieldSelect', () => {
  test('upserts newly created sort fields into collection metadata', () => {
    const nextFields = upsertKanbanCollectionFieldOptions(
      [
        { name: 'title', interface: 'input' },
        { name: 'status', interface: 'select' },
      ],
      { name: 'status_sort', interface: 'sort', scopeKey: 'status' },
    );

    expect(nextFields).toEqual([
      { name: 'title', interface: 'input' },
      { name: 'status', interface: 'select' },
      { name: 'status_sort', interface: 'sort', scopeKey: 'status' },
    ]);
  });

  test('updates existing field metadata when an integer field is converted to sort', () => {
    const nextFields = upsertKanbanCollectionFieldOptions(
      [
        { name: 'priority', interface: 'integer', type: 'integer' },
        { name: 'status', interface: 'select' },
      ],
      { name: 'priority', interface: 'sort', type: 'sort', scopeKey: 'status' },
    );

    expect(nextFields).toEqual([
      { name: 'priority', interface: 'sort', type: 'sort', scopeKey: 'status' },
      { name: 'status', interface: 'select' },
    ]);
  });
});
