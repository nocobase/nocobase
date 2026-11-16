/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionParams, APIClient } from '@nocobase/sdk';
import { renderHook } from '@nocobase/test/client';
import { message } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import qs from 'qs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as CollectionHook from '../../../collection-manager/hooks/useCollection_deprecated';
import * as CollectionManagerProvider from '../../../data-source/collection/CollectionManagerProvider';
import * as ActionHooks from '../../../schema-component/antd/action/hooks';
import * as BlockProvider from '../../BlockProvider';
import { TableFieldResource } from '../../TableFieldProvider';
import { useBulkDestroyActionProps } from '../../hooks';

function createState() {
  return {
    associationName: 'orgs.users' as string | undefined,
    association: { type: 'hasMany', targetKey: 'code' } as { type: string; targetKey?: string },
    collection: { filterTargetKey: ['code', 'staffname'] as string | string[] },
    field: {
      data: {
        selectedRowKeys: ['row-1', 'row-2'] as (string | number)[],
        selectedRowData: [
          { code: 'A', staffname: 'first' },
          { code: 'B', staffname: 'second' },
        ] as Record<string, unknown>[] | undefined,
      },
    },
    resource: { destroy: vi.fn().mockResolvedValue(true) },
    service: { params: [{ page: 2 }], data: { meta: { totalPage: 2 } }, refresh: vi.fn() },
    parent: { block: 'table' },
    setSubmitted: vi.fn(),
  };
}

let state: ReturnType<typeof createState>;

beforeEach(() => {
  state = createState();
  vi.spyOn(BlockProvider, 'useBlockRequestContext').mockImplementation(
    () => ({ ...state, __parent: state.parent }) as ReturnType<typeof BlockProvider.useBlockRequestContext>,
  );
  vi.spyOn(BlockProvider, 'useBlockAssociationContext').mockImplementation(() => state.associationName);
  vi.spyOn(CollectionManagerProvider, 'useCollectionManager').mockReturnValue({
    getCollectionField: (name: string) => name && state.association,
  } as ReturnType<typeof CollectionManagerProvider.useCollectionManager>);
  vi.spyOn(CollectionHook, 'useCollection_deprecated').mockImplementation(
    () => state.collection as ReturnType<typeof CollectionHook.useCollection_deprecated>,
  );
  vi.spyOn(ActionHooks, 'useActionContext').mockImplementation(() => ({
    setSubmitted: state.setSubmitted,
    setVisible: vi.fn(),
  }));
  vi.spyOn(message, 'error').mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe('useBulkDestroyActionProps hasMany', () => {
  it('uses association target values and preserves successful deletion callbacks', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick(undefined, callback);
    expect(state.resource.destroy).toHaveBeenCalledWith({ filterByTk: ['A', 'B'] });
    expect(state.field.data.selectedRowKeys).toEqual([]);
    expect(state.service.params[0].page).toBe(1);
    expect(callback).toHaveBeenCalledOnce();
    expect(state.setSubmitted).toHaveBeenCalledWith(true);
    expect(state.service.refresh).toHaveBeenCalledOnce();
  });

  it('uses the target key even when selected keys use another scalar identifier', async () => {
    state.collection.filterTargetKey = 'staffname';
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith({ filterByTk: ['A', 'B'] });
  });

  it('supports uppercase target keys and zero', async () => {
    state.association.targetKey = 'ID';
    state.field.data.selectedRowData = [{ ID: 0 }, { ID: '9223372036854775807' }];
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith({ filterByTk: [0, '9223372036854775807'] });
  });

  it.each([undefined, null, '', {}, [], false, NaN, Infinity])(
    'rejects the entire batch for invalid key %s',
    async (value) => {
      state.field.data.selectedRowData[1].code = value;
      const callback = vi.fn();
      const { result } = renderHook(() => useBulkDestroyActionProps());
      await result.current.onClick(undefined, callback);
      expect(state.resource.destroy).not.toHaveBeenCalled();
      expect(message.error).toHaveBeenCalledOnce();
      expect(state.field.data.selectedRowKeys).toEqual(['row-1', 'row-2']);
      expect(state.service.params[0].page).toBe(2);
      expect(callback).not.toHaveBeenCalled();
      expect(state.setSubmitted).not.toHaveBeenCalled();
      expect(state.service.refresh).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, [], [{ code: 'A' }]])('rejects missing or incomplete selected row data', async (rows) => {
    state.field.data.selectedRowData = rows;
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledOnce();
  });

  it.each([undefined, ''])('rejects missing target key metadata %s', async (key) => {
    state.association.targetKey = key;
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledOnce();
  });

  it('does not require selected row data when selection is empty', async () => {
    state.field.data.selectedRowKeys = [];
    state.field.data.selectedRowData = undefined;
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).not.toHaveBeenCalled();
    expect(message.error).not.toHaveBeenCalled();
  });

  it.each([undefined, 'belongsToMany', 'hasOne', 'belongsTo'])('preserves object identifiers for %s', async (type) => {
    state.associationName = type ? 'orgs.users' : undefined;
    state.association.type = type;
    const rows = state.field.data.selectedRowData;
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith({ filterByTk: rows });
  });

  it('preserves selected keys for a normal collection', async () => {
    state.associationName = undefined;
    state.collection.filterTargetKey = 'id';
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith({ filterByTk: ['row-1', 'row-2'] });
  });

  it.each(['resource', 'parent'])('preserves in-memory TableField indices via %s', async (kind) => {
    state.collection.filterTargetKey = 'id';
    state.field.data.selectedRowKeys = [0, 2];
    state.field.data.selectedRowData = undefined;
    if (kind === 'resource') {
      state.resource = Object.assign(new TableFieldResource({ api: new APIClient(), resource: 'orgs.users' }), {
        destroy: vi.fn().mockResolvedValue(true),
      });
    } else {
      state.parent.block = 'TableField';
    }
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith({ filterByTk: [0, 2] });
  });

  it('serializes scalar array members including a JSON-shaped string key', async () => {
    state.field.data.selectedRowData = [{ code: 'S1523968' }, { code: '["A","B"]' }];
    const api = new APIClient({ baseURL: 'http://localhost/api/' });
    const mock = new MockAdapter(api.axios);
    mock.onPost('orgs/110013/users:destroy').reply(200, { data: true });
    state.resource.destroy = vi.fn((params: ActionParams) => api.resource('orgs.users', '110013').destroy(params));
    try {
      const { result } = renderHook(() => useBulkDestroyActionProps());
      await result.current.onClick();
      expect(mock.history.post).toHaveLength(1);
      const config = mock.history.post[0];
      const paramsSerializer =
        typeof config.paramsSerializer === 'function'
          ? { serialize: config.paramsSerializer }
          : config.paramsSerializer;
      const url = new URL(api.axios.getUri({ ...config, paramsSerializer }));
      expect(url.pathname).toBe('/api/orgs/110013/users:destroy');
      expect(qs.parse(url.search.slice(1)).filterByTk).toEqual(['S1523968', '["A","B"]']);
    } finally {
      mock.restore();
    }
  });

  it('keeps selection and pagination when the request fails', async () => {
    state.resource.destroy.mockRejectedValue(new Error('rejected'));
    const { result } = renderHook(() => useBulkDestroyActionProps());
    await expect(result.current.onClick()).rejects.toThrow('rejected');
    expect(state.field.data.selectedRowKeys).toEqual(['row-1', 'row-2']);
    expect(state.service.params[0].page).toBe(2);
    expect(state.setSubmitted).not.toHaveBeenCalled();
    expect(state.service.refresh).not.toHaveBeenCalled();
  });
});
