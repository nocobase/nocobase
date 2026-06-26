/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  COMMENT_OWNER_FILTER_BY_TK_VARIABLE,
  COMMENT_OWNER_VARIABLE_EXAMPLE,
  createOwnerFieldFilter,
  getAssociationRecordCommentFieldMapping,
  getAssociationSourceCollectionName,
  getDefaultRecordCommentFieldMapping,
  getCommentOwnerFieldOptions,
  getCommentUserFieldOptions,
  isContextVariableExpression,
  isContextVariablePath,
  isContextVariableValue,
  resolveCommentOwnerValue,
  resolveCommentOwnerValueFromFilterByTk,
} from '../utils';

describe('record comments owner value utils', () => {
  it('detects full ctx variable expressions', () => {
    expect(isContextVariableExpression('{{ ctx.record.id }}')).toBe(true);
    expect(isContextVariableExpression('{{ctx.view.inputArgs.filterByTk}}')).toBe(true);
    expect(isContextVariableExpression('id')).toBe(false);
    expect(isContextVariableExpression('prefix {{ ctx.record.id }}')).toBe(false);
  });

  it('detects ctx variable path shorthand', () => {
    expect(isContextVariablePath('ctx.record.id')).toBe(true);
    expect(isContextVariablePath('ctx.view.inputArgs.filterByTk')).toBe(true);
    expect(isContextVariablePath('record.id')).toBe(false);
    expect(isContextVariableValue('ctx.record.id')).toBe(true);
    expect(isContextVariableValue('{{ ctx.record.id }}')).toBe(true);
  });

  it('resolves legacy current record field paths', async () => {
    await expect(
      resolveCommentOwnerValue(
        {
          record: {
            id: 12,
            user: {
              id: 34,
            },
          },
        },
        'user.id',
      ),
    ).resolves.toBe(34);
  });

  it('resolves ctx variable expressions through the flow context', async () => {
    const resolveJsonTemplate = vi.fn(async () => 56);

    await expect(
      resolveCommentOwnerValue(
        {
          record: { id: 12 },
          resolveJsonTemplate,
        },
        COMMENT_OWNER_VARIABLE_EXAMPLE,
      ),
    ).resolves.toBe(56);
    expect(resolveJsonTemplate).toHaveBeenCalledWith(COMMENT_OWNER_VARIABLE_EXAMPLE);
  });

  it('resolves ctx variable path shorthand through the flow context', async () => {
    const resolveJsonTemplate = vi.fn(async () => 78);

    await expect(
      resolveCommentOwnerValue(
        {
          record: { id: 12 },
          resolveJsonTemplate,
        },
        'ctx.record.id',
      ),
    ).resolves.toBe(78);
    expect(resolveJsonTemplate).toHaveBeenCalledWith('{{ ctx.record.id }}');
  });

  it('does not infer a default owner variable', async () => {
    const resolveJsonTemplate = vi.fn();

    await expect(
      resolveCommentOwnerValue({
        record: { id: 12 },
        resolveJsonTemplate,
      }),
    ).resolves.toBeUndefined();
    expect(resolveJsonTemplate).not.toHaveBeenCalled();
  });

  it('resolves owner variable values from value objects', async () => {
    const resolveJsonTemplate = vi.fn(async () => 90);

    await expect(
      resolveCommentOwnerValue(
        {
          record: { id: 12 },
          resolveJsonTemplate,
        },
        { value: 'ctx.record.id' },
      ),
    ).resolves.toBe(90);

    expect(resolveJsonTemplate).toHaveBeenCalledWith('{{ ctx.record.id }}');
  });

  it('resolves record field paths from value objects', async () => {
    await expect(
      resolveCommentOwnerValue(
        {
          record: {
            owner: {
              id: 'record-2',
            },
          },
        },
        { value: 'owner' },
      ),
    ).resolves.toBe('record-2');
  });

  it('ignores invalid owner variable values', async () => {
    const resolveJsonTemplate = vi.fn();

    await expect(
      resolveCommentOwnerValue(
        {
          record: { id: 12 },
          resolveJsonTemplate,
        },
        ['ctx.record.id'],
      ),
    ).resolves.toBeUndefined();

    expect(resolveJsonTemplate).not.toHaveBeenCalled();
  });

  it('normalizes object values to scalar owner values', async () => {
    await expect(
      resolveCommentOwnerValue(
        {
          record: {
            owner: {
              id: 'record-1',
              name: 'Record 1',
            },
          },
        },
        'owner',
      ),
    ).resolves.toBe('record-1');
  });

  it('falls back to current view filterByTk for ctx.record.id', () => {
    expect(resolveCommentOwnerValueFromFilterByTk('ctx.record.id', 91)).toBe(91);
    expect(resolveCommentOwnerValueFromFilterByTk('{{ ctx.record.id }}', { id: 92 })).toBe(92);
    expect(resolveCommentOwnerValueFromFilterByTk('record.id', { id: 93 })).toBe(93);
  });

  it('falls back to current view filterByTk for popup record variables', () => {
    expect(resolveCommentOwnerValueFromFilterByTk('ctx.popup.record.id', 94)).toBe(94);
    expect(resolveCommentOwnerValueFromFilterByTk('{{ ctx.popup.record.id }}', { id: 95 })).toBe(95);
    expect(resolveCommentOwnerValueFromFilterByTk('popup.record.id', { id: 96 })).toBe(96);
  });

  it('falls back to current view filterByTk for custom current-record target keys', () => {
    expect(resolveCommentOwnerValueFromFilterByTk('ctx.record.code', { code: 'P-1001' }, 'code')).toBe('P-1001');
    expect(resolveCommentOwnerValueFromFilterByTk('{{ ctx.record.code }}', 'P-1002', 'code')).toBe('P-1002');
    expect(resolveCommentOwnerValueFromFilterByTk('{{ ctx.popup.record.code }}', { code: 'P-1004' }, 'code')).toBe(
      'P-1004',
    );
  });

  it('uses explicit filterByTk variables directly', () => {
    expect(resolveCommentOwnerValueFromFilterByTk('ctx.view.inputArgs.filterByTk', 95)).toBe(95);
    expect(resolveCommentOwnerValueFromFilterByTk('{{ ctx.view.inputArgs.filterByTk }}', { id: 96 })).toBe(96);
    expect(resolveCommentOwnerValueFromFilterByTk('ctx.inputArgs.filterByTk', { code: 'P-1003' }, 'code')).toBe(
      'P-1003',
    );
  });

  it('does not use filterByTk fallback for unrelated record fields', () => {
    expect(resolveCommentOwnerValueFromFilterByTk('ctx.record.title', { id: 94, title: 'Hello' })).toBeUndefined();
    expect(resolveCommentOwnerValueFromFilterByTk('ctx.view.inputArgs.sourceId', 97)).toBeUndefined();
  });

  it('accepts already-resolved scalar owner values', () => {
    expect(resolveCommentOwnerValueFromFilterByTk(1, 98)).toBe(1);
    expect(resolveCommentOwnerValueFromFilterByTk('record-1', 99)).toBe('record-1');
    expect(resolveCommentOwnerValueFromFilterByTk(true, 100)).toBe(true);
  });

  it('only exposes many-to-one fields as owner field options', () => {
    expect(
      getCommentOwnerFieldOptions({
        fields: [
          { name: 'content', type: 'text', title: 'Content' },
          { name: 'task', type: 'belongsTo', interface: 'm2o', title: 'Task' },
          { name: 'tags', type: 'belongsToMany', interface: 'm2m', title: 'Tags' },
        ],
      }),
    ).toEqual([{ label: 'Task', value: 'task' }]);
  });

  it('defaults comment owner mapping to the current popup collection relation', () => {
    expect(
      getDefaultRecordCommentFieldMapping({
        currentCollectionName: 'tasks',
        collection: {
          fields: [
            { name: 'project', type: 'belongsTo', interface: 'm2o', title: 'Project', target: 'projects' },
            { name: 'task', type: 'belongsTo', interface: 'm2o', title: 'Task', target: 'tasks' },
          ],
        },
      }),
    ).toEqual({
      ownerField: 'task',
      ownerValueField: COMMENT_OWNER_FILTER_BY_TK_VARIABLE,
    });
  });

  it('does not default comment owner mapping when the current popup collection has no relation field', () => {
    expect(
      getDefaultRecordCommentFieldMapping({
        currentCollectionName: 'tasks',
        collection: {
          fields: [{ name: 'project', type: 'belongsTo', interface: 'm2o', title: 'Project', target: 'projects' }],
        },
      }),
    ).toEqual({});
  });

  it('resolves the association source collection name from the association object first', () => {
    expect(
      getAssociationSourceCollectionName({
        association: {
          collection: {
            name: 'posts',
          },
        },
        associationName: 'tasks.comments',
      }),
    ).toBe('posts');
  });

  it('falls back to parsing the association name for the source collection name', () => {
    expect(
      getAssociationSourceCollectionName({
        associationName: 'posts.comments',
      }),
    ).toBe('posts');
  });

  it('defaults comment owner mapping from the association source collection', () => {
    expect(
      getAssociationRecordCommentFieldMapping({
        associationName: 'posts.comments',
        collection: {
          fields: [
            { name: 'post', type: 'belongsTo', interface: 'm2o', title: 'Post', target: 'posts' },
            { name: 'task', type: 'belongsTo', interface: 'm2o', title: 'Task', target: 'tasks' },
          ],
        },
      }),
    ).toEqual({
      ownerField: 'post',
      ownerValueField: COMMENT_OWNER_FILTER_BY_TK_VARIABLE,
    });
  });

  it('only exposes users many-to-one fields as commenter field options', () => {
    expect(
      getCommentUserFieldOptions({
        fields: [
          { name: 'content', type: 'text', title: 'Content' },
          { name: 'task', type: 'belongsTo', interface: 'm2o', title: 'Task', target: 'tasks' },
          { name: 'creator', type: 'belongsTo', interface: 'm2o', title: 'Creator', target: 'users' },
          {
            name: 'assignee',
            type: 'belongsTo',
            interface: 'm2o',
            title: 'Assignee',
            targetCollection: { name: 'users' },
          },
          { name: 'members', type: 'belongsToMany', interface: 'm2m', title: 'Members', target: 'users' },
        ],
      }),
    ).toEqual([
      { label: 'Creator', value: 'creator' },
      { label: 'Assignee', value: 'assignee' },
    ]);
  });

  it('builds owner filters with association target keys for many-to-one fields', () => {
    expect(
      createOwnerFieldFilter(
        {
          fields: [{ name: 'task', type: 'belongsTo', interface: 'm2o', targetKey: 'uuid' }],
        },
        'task',
        'task-1',
      ),
    ).toEqual({
      task: {
        uuid: {
          $eq: 'task-1',
        },
      },
    });
  });
});
