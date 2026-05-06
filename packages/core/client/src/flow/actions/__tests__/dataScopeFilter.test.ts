/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { dataScope } from '../dataScope';
import { normalizeDataScopeFilter } from '../dataScopeFilter';
import { setTargetDataScope } from '../setTargetDataScope';

describe('normalizeDataScopeFilter', () => {
  it('keeps null when a right-side variable resolves to empty', () => {
    const rawFilter = {
      logic: '$and',
      items: [{ path: 'departmentId', operator: '$eq', value: '{{ ctx.formValues.department.id }}' }],
    };
    const resolvedFilter = {
      logic: '$and',
      items: [{ path: 'departmentId', operator: '$eq', value: undefined }],
    };

    expect(normalizeDataScopeFilter(rawFilter, resolvedFilter)).toEqual({
      $and: [{ departmentId: { $eq: null } }],
    });
  });

  it('keeps null when a right-side variable resolves to an empty string', () => {
    const rawFilter = {
      logic: '$and',
      items: [{ path: 'departmentId', operator: '$eq', value: '{{ ctx.formValues.department.id }}' }],
    };
    const resolvedFilter = {
      logic: '$and',
      items: [{ path: 'departmentId', operator: '$eq', value: '' }],
    };

    expect(normalizeDataScopeFilter(rawFilter, resolvedFilter)).toEqual({
      $and: [{ departmentId: { $eq: null } }],
    });
  });

  it('still prunes empty constant values', () => {
    const filter = {
      logic: '$and',
      items: [{ path: 'departmentId', operator: '$eq', value: undefined }],
    };

    expect(normalizeDataScopeFilter(filter, filter)).toBeUndefined();
  });

  it('handles nested groups and keeps non-empty values unchanged', () => {
    const rawFilter = {
      logic: '$and',
      items: [
        { path: 'status', operator: '$eq', value: 'active' },
        {
          logic: '$or',
          items: [{ path: 'departmentId', operator: '$eq', value: '{{ ctx.formValues.department.id }}' }],
        },
      ],
    };
    const resolvedFilter = {
      logic: '$and',
      items: [
        { path: 'status', operator: '$eq', value: 'active' },
        {
          logic: '$or',
          items: [{ path: 'departmentId', operator: '$eq', value: null }],
        },
      ],
    };

    expect(normalizeDataScopeFilter(rawFilter, resolvedFilter)).toEqual({
      $and: [{ status: { $eq: 'active' } }, { $or: [{ departmentId: { $eq: null } }] }],
    });
  });

  it('does not preserve explicit null constants', () => {
    const filter = {
      logic: '$and',
      items: [{ path: 'departmentId', operator: '$eq', value: null }],
    };

    expect(normalizeDataScopeFilter(filter, filter)).toBeUndefined();
  });

  it('dataScope handler sends null for empty variable dependencies', async () => {
    const resource = {
      addFilterGroup: vi.fn(),
      removeFilterGroup: vi.fn(),
    };
    const ctx = {
      model: {
        uid: 'field-1',
        resource,
      },
      resolveJsonTemplate: vi.fn(async (template) => ({
        ...template,
        items: [{ ...template.items[0], value: undefined }],
      })),
    };
    const params = {
      filter: {
        logic: '$and',
        items: [{ path: 'departmentId', operator: '$eq', value: '{{ ctx.formValues.department.id }}' }],
      },
    };

    await (dataScope as any).handler(ctx, params);

    expect(resource.addFilterGroup).toHaveBeenCalledWith('field-1', {
      $and: [{ departmentId: { $eq: null } }],
    });
    expect(resource.removeFilterGroup).not.toHaveBeenCalled();
  });

  it('setTargetDataScope handler sends null for empty variable dependencies', async () => {
    const resource = {
      addFilterGroup: vi.fn(),
      removeFilterGroup: vi.fn(),
      hasData: vi.fn(() => false),
      refresh: vi.fn(),
    };
    const targetModel = { resource };
    const ctx = {
      model: {
        uid: 'action-1',
        scheduleModelOperation: vi.fn((_uid, callback) => callback(targetModel)),
      },
      resolveJsonTemplate: vi.fn(async (template) => ({
        ...template,
        filter: {
          ...template.filter,
          items: [{ ...template.filter.items[0], value: undefined }],
        },
      })),
    };
    const params = {
      targetBlockUid: 'target-1',
      filter: {
        logic: '$and',
        items: [{ path: 'departmentId', operator: '$eq', value: '{{ ctx.formValues.department.id }}' }],
      },
    };

    await (setTargetDataScope as any).handler(ctx, params);

    expect(ctx.model.scheduleModelOperation).toHaveBeenCalledWith('target-1', expect.any(Function));
    expect(resource.addFilterGroup).toHaveBeenCalledWith('setTargetDataScope_action-1', {
      $and: [{ departmentId: { $eq: null } }],
    });
    expect(resource.removeFilterGroup).not.toHaveBeenCalled();
  });
});
