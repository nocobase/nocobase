/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildKanbanBoardDisplayItems,
  areKanbanGroupOptionsEqual,
  buildKanbanColumns,
  createKanbanColumnFilter,
  getKanbanRecordKey,
  getKanbanCollectionFilterTargetKey,
  getKanbanCrossColumnMoveParams,
  getKanbanDefaultSortFieldName,
  getKanbanGroupFieldCandidates,
  getKanbanGroupFieldSortScopeKeys,
  getKanbanPreferredSortScopeKey,
  getKanbanPreviewInsertIndex,
  getRecordKanbanColumnKey,
  getRecordGroupValues,
  getKanbanMoveParamsFromPreviewOrder,
  getKanbanSameColumnColumnDropMoveParams,
  isSameKanbanGroupingValue,
  mergeKanbanFilters,
  normalizeKanbanGroupOptions,
  orderKanbanGroupOptionsBySelection,
  reorderKanbanGroupOptions,
  shouldMigrateKanbanSortFieldScope,
  shouldInsertAfterSameColumnCardMove,
} from '../models/utils';

describe('kanban model utils', () => {
  test('normalizeKanbanGroupOptions merges saved options with source options', () => {
    const options = normalizeKanbanGroupOptions(
      [
        { value: 'todo', label: 'Todo' },
        { value: 'done', label: 'Done', color: 'green' },
      ],
      [{ value: 'todo', label: 'Backlog', color: 'blue' }],
    );

    expect(options).toEqual([
      { value: 'todo', label: 'Backlog', color: 'blue', isUnknown: undefined },
      { value: 'done', label: 'Done', color: 'green', isUnknown: undefined },
    ]);
  });

  test('normalizeKanbanGroupOptions preserves saved order and appends new source options', () => {
    const options = normalizeKanbanGroupOptions(
      [
        { value: 'todo', label: 'Todo', color: 'blue' },
        { value: 'doing', label: 'Doing', color: 'orange' },
        { value: 'done', label: 'Done', color: 'green' },
      ],
      [
        { value: 'done', label: 'Done', color: 'green', enabled: true },
        { value: 'todo', label: 'Todo', color: 'blue', enabled: true },
      ],
    );

    expect(options.map((item) => item.value)).toEqual(['done', 'todo', 'doing']);
  });

  test('normalizeKanbanGroupOptions keeps colors empty when source enum colors are missing', () => {
    const options = normalizeKanbanGroupOptions([
      { value: 'todo', label: 'Todo', color: 'default' },
      { value: 'doing', label: 'Doing', color: 'default' },
      { value: 'done', label: 'Done' },
    ]);

    expect(options.map((item) => item.color)).toEqual([undefined, undefined, undefined]);
  });

  test('normalizeKanbanGroupOptions falls back to enum title when label is absent', () => {
    const options = normalizeKanbanGroupOptions([
      { value: 'todo', title: 'To do' },
      { value: 'done', name: 'Done name' },
    ] as any);

    expect(options).toEqual([
      { value: 'todo', label: 'To do', color: undefined, isUnknown: undefined },
      { value: 'done', label: 'Done name', color: undefined, isUnknown: undefined },
    ]);
  });

  test('normalizeKanbanGroupOptions can skip default and saved colors for relation options', () => {
    const options = normalizeKanbanGroupOptions(
      [{ value: 'u1', label: 'User 1' }],
      [{ value: 'u1', label: 'User 1', color: 'blue' }],
      {
        useDefaultColors: false,
        preserveSavedColors: false,
      },
    );

    expect(options).toEqual([{ value: 'u1', label: 'User 1', color: undefined, isUnknown: undefined }]);
  });

  test('orderKanbanGroupOptionsBySelection keeps enabled values in selection order', () => {
    expect(
      orderKanbanGroupOptionsBySelection(
        [
          { value: 'todo', label: 'Todo', enabled: true },
          { value: 'doing', label: 'Doing', enabled: false },
          { value: 'done', label: 'Done', enabled: true },
        ],
        ['done', 'todo'],
      ),
    ).toEqual([
      { value: 'done', label: 'Done', enabled: true },
      { value: 'todo', label: 'Todo', enabled: true },
      { value: 'doing', label: 'Doing', enabled: false },
    ]);
  });

  test('getKanbanGroupFieldCandidates supports plain collection objects', () => {
    expect(
      getKanbanGroupFieldCandidates({
        fields: [
          { name: 'status', interface: 'select', uiSchema: { title: 'Status' } },
          { name: 'priority', interface: 'radioGroup', uiSchema: { title: 'Priority' } },
          { name: 'owner', interface: 'm2o', title: 'Owner' },
          { name: 'watchers', interface: 'm2m', title: 'Watchers' },
          { name: 'title', interface: 'input' },
        ],
      }),
    ).toEqual([
      { label: 'Status', value: 'status' },
      { label: 'Owner', value: 'owner' },
    ]);
  });

  test('getKanbanDefaultSortFieldName uses the grouping field name', () => {
    expect(getKanbanDefaultSortFieldName('status')).toBe('status_sort');
    expect(getKanbanDefaultSortFieldName()).toBeUndefined();
  });

  test('association grouping fields prefer the raw foreign key as sort scope', () => {
    const groupField = { name: 'owner', interface: 'm2o', foreignKey: 'owner_id' };

    expect(getKanbanGroupFieldSortScopeKeys(groupField)).toEqual(['owner_id', 'owner']);
    expect(getKanbanPreferredSortScopeKey(groupField)).toBe('owner_id');
  });

  test('legacy association sort fields are marked for scope migration', () => {
    const groupField = { name: 'owner', interface: 'm2o', foreignKey: 'owner_id' };

    expect(
      shouldMigrateKanbanSortFieldScope({
        groupField,
        sortField: { name: 'owner_sort', interface: 'sort', scopeKey: 'owner' },
      }),
    ).toBe(true);

    expect(
      shouldMigrateKanbanSortFieldScope({
        groupField,
        sortField: { name: 'owner_sort', interface: 'sort', scopeKey: 'owner_id' },
      }),
    ).toBe(false);
  });

  test('getKanbanCollectionFilterTargetKey supports plain collection metadata', () => {
    expect(getKanbanCollectionFilterTargetKey({ filterTargetKey: ['slug'] })).toBe('slug');
    expect(
      getKanbanCollectionFilterTargetKey({
        fields: [{ name: 'pk', primaryKey: true }],
      }),
    ).toBe('pk');
  });

  test('getRecordGroupValues resolves scalar and association values', () => {
    expect(getRecordGroupValues({ status: 'todo' }, { name: 'status', interface: 'select' })).toEqual(['todo']);

    expect(
      getRecordGroupValues(
        {
          users: [{ id: 1 }, { id: 2 }],
        },
        { name: 'users', interface: 'm2m' },
      ),
    ).toEqual(['1', '2']);

    expect(
      getRecordGroupValues(
        {
          owner: { rows: [{ id: 3 }] },
        },
        { name: 'owner', interface: 'm2o' },
      ),
    ).toEqual(['3']);

    expect(
      getRecordGroupValues(
        {
          owner: { slug: 'u-1', nickname: 'User 1' },
        },
        {
          name: 'owner',
          interface: 'm2o',
          targetKey: 'slug',
          targetCollection: { filterTargetKey: 'slug' },
        },
      ),
    ).toEqual(['u-1']);
  });

  test('buildKanbanColumns preserves configured order and routes unmatched records to Unknown', () => {
    const columns = buildKanbanColumns({
      records: [
        { id: 1, status: 'done' },
        { id: 2, status: 'todo' },
        { id: 3, status: 'other' },
      ],
      primaryKey: 'id',
      groupField: { name: 'status', interface: 'select' },
      groupOptions: [
        { value: 'todo', label: 'Todo', color: 'blue', enabled: true },
        { value: 'done', label: 'Done', color: 'green', enabled: true },
      ],
    });

    expect(columns.map((column) => column.key)).toEqual(['__unknown__', 'todo', 'done']);
    expect(columns[0].records.map((record) => record.id)).toEqual([3]);
    expect(columns[1].records.map((record) => record.id)).toEqual([2]);
    expect(columns[2].records.map((record) => record.id)).toEqual([1]);
  });

  test('getRecordKanbanColumnKey resolves one canonical column for multi-value records', () => {
    expect(
      getRecordKanbanColumnKey({
        record: {
          watchers: [{ id: 2 }, { id: 1 }],
        },
        groupField: { name: 'watchers', interface: 'm2m' },
        groupOptions: [
          { value: '1', enabled: true },
          { value: '2', enabled: true },
        ],
      }),
    ).toBe('1');

    expect(
      getRecordKanbanColumnKey({
        record: { status: null },
        groupField: { name: 'status', interface: 'select' },
        groupOptions: [{ value: 'todo', enabled: true }],
      }),
    ).toBe('__unknown__');

    expect(
      getRecordKanbanColumnKey({
        record: {
          owner: { slug: 'u-1', nickname: 'User 1' },
        },
        groupField: {
          name: 'owner',
          interface: 'm2o',
          targetKey: 'slug',
          targetCollection: { filterTargetKey: 'slug' },
        },
        groupOptions: [{ value: 'u-1', enabled: true }],
      }),
    ).toBe('u-1');
  });

  test('getKanbanRecordKey respects collection filterTargetKey when record.id is absent', () => {
    expect(
      getKanbanRecordKey(
        { slug: 'post-1', title: 'Hello' },
        {
          filterTargetKey: 'slug',
        },
      ),
    ).toBe('post-1');

    expect(
      getKanbanRecordKey(
        { orgId: 'o1', userId: 'u1' },
        {
          filterTargetKey: ['orgId', 'userId'],
        },
      ),
    ).toBe('orgId:o1|userId:u1');
  });

  test('getKanbanSameColumnColumnDropMoveParams persists same-column column drops after the last remaining card', () => {
    expect(
      getKanbanSameColumnColumnDropMoveParams({
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
        sourceRecord: { id: 1 },
        collection: { filterTargetKey: 'id' },
      }),
    ).toEqual({
      targetId: 3,
      method: 'insertAfter',
    });
  });

  test('getKanbanSameColumnColumnDropMoveParams returns undefined when no anchor card remains', () => {
    expect(
      getKanbanSameColumnColumnDropMoveParams({
        items: [{ id: 1 }],
        sourceRecord: { id: 1 },
        collection: { filterTargetKey: 'id' },
      }),
    ).toBeUndefined();
  });

  test('shouldInsertAfterSameColumnCardMove matches same-column downward drag semantics', () => {
    expect(shouldInsertAfterSameColumnCardMove(0, 1)).toBe(true);
    expect(shouldInsertAfterSameColumnCardMove(1, 3)).toBe(true);
    expect(shouldInsertAfterSameColumnCardMove(3, 1)).toBe(false);
    expect(shouldInsertAfterSameColumnCardMove(1, 1)).toBe(false);
  });

  test('getKanbanPreviewInsertIndex keeps same-column downward preview aligned with persisted order', () => {
    expect(
      getKanbanPreviewInsertIndex({
        sourceColumnKey: 'todo',
        currentSourceColumnKey: 'todo',
        targetColumnKey: 'todo',
        sourceIndex: 0,
        overIndex: 2,
        targetIndex: 1,
        overType: 'card',
      }),
    ).toBe(2);

    expect(
      getKanbanPreviewInsertIndex({
        sourceColumnKey: 'todo',
        currentSourceColumnKey: 'todo',
        targetColumnKey: 'todo',
        sourceIndex: 2,
        overIndex: 1,
        targetIndex: 1,
        overType: 'card',
      }),
    ).toBe(1);
  });

  test('getKanbanPreviewInsertIndex keeps cross-column preview stable after the card is already in the target column', () => {
    expect(
      getKanbanPreviewInsertIndex({
        sourceColumnKey: 'todo',
        currentSourceColumnKey: 'done',
        targetColumnKey: 'done',
        sourceIndex: 1,
        overIndex: 2,
        targetIndex: 1,
        overType: 'card',
      }),
    ).toBe(1);
  });

  test('getKanbanMoveParamsFromPreviewOrder derives move anchors from the final preview order', () => {
    expect(
      getKanbanMoveParamsFromPreviewOrder({
        items: [{ id: 2 }, { id: 1 }, { id: 3 }],
        activeRecord: { id: 1 },
        collection: { filterTargetKey: 'id' },
      }),
    ).toEqual({ targetId: 2, method: 'insertAfter' });

    expect(
      getKanbanMoveParamsFromPreviewOrder({
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
        activeRecord: { id: 1 },
        collection: { filterTargetKey: 'id' },
      }),
    ).toEqual({ targetId: 2 });

    expect(
      getKanbanMoveParamsFromPreviewOrder({
        items: [{ id: 1 }],
        activeRecord: { id: 1 },
        collection: { filterTargetKey: 'id' },
      }),
    ).toEqual({});
  });

  test('getKanbanCrossColumnMoveParams uses target card anchors instead of mixing targetScope', () => {
    expect(
      getKanbanCrossColumnMoveParams({
        overType: 'card',
        overRecord: { id: 2 },
        targetColumnKey: 'done',
        groupFieldName: 'status',
        collection: { filterTargetKey: 'id' },
      }),
    ).toEqual({ targetId: 2 });

    expect(
      getKanbanCrossColumnMoveParams({
        overType: 'card',
        overRecord: { id: 2 },
        targetColumnKey: 'done',
        groupFieldName: 'status',
        collection: { filterTargetKey: 'id' },
        insertAfter: true,
      }),
    ).toEqual({ targetId: 2, method: 'insertAfter' });
  });

  test('getKanbanCrossColumnMoveParams falls back to targetScope for empty-column drops', () => {
    expect(
      getKanbanCrossColumnMoveParams({
        overType: 'column',
        targetColumnKey: 'done',
        groupFieldName: 'status',
      }),
    ).toEqual({
      targetScope: {
        status: 'done',
      },
    });

    expect(
      getKanbanCrossColumnMoveParams({
        overType: 'column',
        targetColumnKey: '__unknown__',
        groupFieldScopeKey: 'status',
      }),
    ).toEqual({
      targetScope: {
        status: null,
      },
    });
  });

  test('buildKanbanBoardDisplayItems keeps each record in one canonical column across column caches', () => {
    const grouped = buildKanbanBoardDisplayItems({
      columnItems: [
        {
          columnKey: 'todo',
          items: [
            { slug: 'post-1', status: 'todo' },
            { slug: 'post-2', status: 'done' },
          ],
        },
        {
          columnKey: 'done',
          items: [
            { slug: 'post-1', status: 'todo' },
            { slug: 'post-2', status: 'done' },
          ],
        },
      ],
      collection: { filterTargetKey: 'slug' },
      groupField: { name: 'status', interface: 'select' },
      groupOptions: [
        { value: 'todo', enabled: true },
        { value: 'done', enabled: true },
      ],
    });

    expect((grouped.todo || []).map((item) => item.slug)).toEqual(['post-1']);
    expect((grouped.done || []).map((item) => item.slug)).toEqual(['post-2']);
  });

  test('buildKanbanBoardDisplayItems prefers optimistic runtime column overrides', () => {
    const grouped = buildKanbanBoardDisplayItems({
      columnItems: [
        {
          columnKey: 'todo',
          items: [{ slug: 'post-1', status: 'todo' }],
        },
        {
          columnKey: 'done',
          items: [{ slug: 'post-1', status: 'todo', __kanbanColumnKey: 'done' }],
        },
      ],
      collection: { filterTargetKey: 'slug' },
      groupField: { name: 'status', interface: 'select' },
      groupOptions: [
        { value: 'todo', enabled: true },
        { value: 'done', enabled: true },
      ],
    });

    expect((grouped.todo || []).map((item) => item.slug)).toEqual([]);
    expect((grouped.done || []).map((item) => item.slug)).toEqual(['post-1']);
  });

  test('mergeKanbanFilters composes base and column filters', () => {
    expect(mergeKanbanFilters({ status: 'open' }, { type: 'task' })).toEqual({
      $and: [{ status: 'open' }, { type: 'task' }],
    });

    expect(mergeKanbanFilters(undefined, undefined)).toBeUndefined();
  });

  test('createKanbanColumnFilter only matches null values for Unknown column', () => {
    expect(
      createKanbanColumnFilter({
        fieldName: 'status',
        enabledValues: ['todo', 'done'],
        isUnknown: true,
      }),
    ).toEqual({ status: null });

    expect(
      createKanbanColumnFilter({
        fieldName: 'status',
        columnValue: 'todo',
      }),
    ).toEqual({ status: 'todo' });
  });

  test('createKanbanColumnFilter targets association targetKey for many-to-one grouping fields', () => {
    expect(
      createKanbanColumnFilter({
        field: {
          name: 'owner',
          interface: 'm2o',
          targetKey: 'slug',
        },
        columnValue: 'alice',
      }),
    ).toEqual({ 'owner.slug': 'alice' });

    expect(
      createKanbanColumnFilter({
        field: {
          name: 'owner',
          interface: 'm2o',
          targetCollection: {
            filterTargetKey: ['slug'],
          },
        },
        enabledValues: ['alice', 'bob'],
        isUnknown: true,
      }),
    ).toEqual({ 'owner.slug': null });
  });

  test('isSameKanbanGroupingValue only matches when grouping payload is unchanged', () => {
    expect(
      isSameKanbanGroupingValue(
        {
          groupField: 'status',
          groupOptions: [{ value: 'todo', label: 'Todo', color: 'blue', enabled: true } as any],
        },
        {
          groupField: 'status',
          groupOptions: [{ value: 'todo', label: 'Todo', color: 'blue', enabled: true } as any],
        },
      ),
    ).toBe(true);

    expect(
      areKanbanGroupOptionsEqual(
        [{ value: 'todo', label: 'Todo', color: 'blue', enabled: true } as any],
        [{ value: 'todo', label: 'Todo', color: 'green', enabled: true } as any],
      ),
    ).toBe(false);
  });

  test('reorderKanbanGroupOptions reorders values by dragged ids', () => {
    expect(
      reorderKanbanGroupOptions(
        [
          { value: 'todo', label: 'Todo', color: 'default', enabled: true },
          { value: 'doing', label: 'Doing', color: 'red', enabled: true },
          { value: 'done', label: 'Done', color: 'green', enabled: true },
        ],
        'done',
        'todo',
      ).map((item) => item.value),
    ).toEqual(['done', 'todo', 'doing']);
  });
});
