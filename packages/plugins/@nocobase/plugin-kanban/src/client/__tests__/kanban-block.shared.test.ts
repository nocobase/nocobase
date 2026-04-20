/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import {
  getKanbanDesignSettingsHost,
  isKanbanDesignSettingsHost,
  shouldHideUnknownColumn,
  shouldMountUnknownColumn,
} from '../models/components/kanban-block/shared';

describe('kanban design settings host', () => {
  test('picks the first card from the first visible non-empty column in design mode', () => {
    const host = getKanbanDesignSettingsHost({
      enabled: true,
      columns: [
        { key: 'todo', value: 'todo', label: 'Todo', color: 'blue' },
        { key: 'done', value: 'done', label: 'Done', color: 'green' },
      ],
      itemsByColumn: {
        todo: [{ __kanbanRecordKey: 'task-1' }, { __kanbanRecordKey: 'task-2' }],
        done: [{ __kanbanRecordKey: 'task-3' }],
      },
    });

    expect(host).toEqual({
      columnKey: 'todo',
      recordKey: 'task-1',
      index: 0,
    });
  });

  test('returns no host outside design mode', () => {
    const host = getKanbanDesignSettingsHost({
      enabled: false,
      columns: [{ key: 'todo', value: 'todo', label: 'Todo', color: 'blue' }],
      itemsByColumn: {
        todo: [{ __kanbanRecordKey: 'task-1' }],
      },
    });

    expect(host).toBeNull();
  });

  test('matches by record key and falls back to index when a runtime key is absent', () => {
    expect(
      isKanbanDesignSettingsHost({
        host: { columnKey: 'todo', recordKey: 'task-1', index: 0 },
        columnKey: 'todo',
        record: { __kanbanRecordKey: 'task-1' },
        index: 3,
      }),
    ).toBe(true);

    expect(
      isKanbanDesignSettingsHost({
        host: { columnKey: 'todo', index: 0 },
        columnKey: 'todo',
        record: { title: 'Untitled task' },
        index: 0,
      }),
    ).toBe(true);

    expect(
      isKanbanDesignSettingsHost({
        host: { columnKey: 'todo', recordKey: 'task-1', index: 0 },
        columnKey: 'done',
        record: { __kanbanRecordKey: 'task-1' },
        index: 0,
      }),
    ).toBe(false);
  });

  test('keeps unknown column mounted but hidden while an empty refresh is still in flight', () => {
    const options = {
      state: {
        items: [],
        page: 1,
        hasNext: false,
        loading: false,
        loadedRefreshToken: 1,
      },
      refreshMeta: {
        token: 2,
        reason: 'global' as const,
      },
      displayItems: [],
    };

    expect(shouldMountUnknownColumn(options)).toBe(true);
    expect(shouldHideUnknownColumn(options)).toBe(true);
  });

  test('shows unknown column when it already has display items during refresh', () => {
    const options = {
      state: {
        items: [{ __kanbanRecordKey: 'task-1' }],
        page: 1,
        hasNext: false,
        loading: true,
        loadedRefreshToken: 1,
      },
      refreshMeta: {
        token: 2,
        reason: 'drag' as const,
      },
      displayItems: [{ __kanbanRecordKey: 'task-1' }],
    };

    expect(shouldMountUnknownColumn(options)).toBe(true);
    expect(shouldHideUnknownColumn(options)).toBe(false);
  });
});
