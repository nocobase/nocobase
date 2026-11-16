/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as Formily from '@formily/react';
import { ActionParams, APIClient } from '@nocobase/sdk';
import { renderHook } from '@nocobase/test/client';
import { message } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as CollectionManagerProvider from '../../../data-source/collection/CollectionManagerProvider';
import * as CollectionRecordProvider from '../../../data-source/collection-record/CollectionRecordProvider';
import * as ActionHooks from '../../../schema-component/antd/action/hooks';
import * as BlockProvider from '../../BlockProvider';
import { TableFieldResource } from '../../TableFieldProvider';
import { useDestroyActionProps } from '../../hooks';
import { parseQuery } from '../../../../../resourcer/src/utils';

const state = {
  associationName: 'orgs.users' as string | undefined,
  association: { type: 'hasMany', targetKey: 'code' } as Record<string, unknown> | undefined,
  record: { code: 'S1523968', staffname: 'Test user' } as Record<string, unknown>,
  filterByTk: { code: 'S1523968', staffname: 'Test user' } as unknown,
  params: {} as Record<string, unknown>,
  resource: { destroy: vi.fn() },
  parent: { block: 'table', service: { refresh: vi.fn() } },
  actionField: { data: {} as Record<string, unknown> },
  setSubmitted: vi.fn(),
};

describe('useDestroyActionProps', () => {
  afterEach(() => vi.restoreAllMocks());

  beforeEach(() => {
    vi.restoreAllMocks();
    state.associationName = 'orgs.users';
    state.association = { type: 'hasMany', targetKey: 'code' };
    state.record = { code: 'S1523968', staffname: 'Test user' };
    state.filterByTk = { code: 'S1523968', staffname: 'Test user' };
    state.params = {};
    state.resource = { destroy: vi.fn().mockResolvedValue(true) };
    state.parent = { block: 'table', service: { refresh: vi.fn() } };
    state.actionField = { data: {} };
    state.setSubmitted = vi.fn();
    vi.spyOn(Formily, 'useField').mockReturnValue(state.actionField as ReturnType<typeof Formily.useField>);
    vi.spyOn(Formily, 'useFieldSchema').mockReturnValue({
      'x-action-settings': { triggerWorkflows: [{ workflowKey: 'workflow', context: 'context' }] },
    } as ReturnType<typeof Formily.useFieldSchema>);
    vi.spyOn(BlockProvider, 'useFilterByTk').mockImplementation(() => state.filterByTk);
    vi.spyOn(BlockProvider, 'useParamsFromRecord').mockImplementation(() => ({
      filterByTk: state.filterByTk,
      ...state.params,
    }));
    vi.spyOn(BlockProvider, 'useBlockAssociationContext').mockImplementation(() => state.associationName);
    vi.spyOn(BlockProvider, 'useBlockRequestContext').mockImplementation(
      () =>
        ({
          resource: state.resource,
          service: { data: { meta: {} } },
          block: 'table',
          field: { data: {} },
          __parent: state.parent,
        }) as ReturnType<typeof BlockProvider.useBlockRequestContext>,
    );
    vi.spyOn(CollectionManagerProvider, 'useCollectionManager').mockReturnValue({
      getCollectionField: (name: string) => name && state.association,
    } as ReturnType<typeof CollectionManagerProvider.useCollectionManager>);
    vi.spyOn(CollectionRecordProvider, 'useCollectionRecordData').mockImplementation(() => state.record);
    vi.spyOn(ActionHooks, 'useActionContext').mockReturnValue({
      setSubmitted: state.setSubmitted,
      setVisible: vi.fn(),
    });
  });

  it('sends the hasMany target key after merging collection identifier parameters', async () => {
    state.params = { targetCollection: 'inherited_users' };
    const callback = vi.fn();
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick(undefined, callback);

    expect(state.resource.destroy).toHaveBeenCalledWith({
      filterByTk: 'S1523968',
      targetCollection: 'inherited_users',
      triggerWorkflows: 'workflow!context',
    });
    expect(callback).toHaveBeenCalledOnce();
    expect(state.setSubmitted).toHaveBeenCalledWith(true);
    expect(state.parent.service.refresh).toHaveBeenCalledOnce();
  });

  it('uses the configured target key even when the collection identifier is a different scalar', async () => {
    state.filterByTk = 'Test user';
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 'S1523968' }));
  });

  it('serializes a scalar target key in the association destroy URL', async () => {
    const api = new APIClient({ baseURL: 'http://localhost/api/' });
    const mock = new MockAdapter(api.axios);
    mock.onPost('orgs/110013/users:destroy').reply(200, { data: true });
    state.resource.destroy = vi.fn((params: ActionParams) => api.resource('orgs.users', '110013').destroy(params));
    try {
      const { result } = renderHook(() => useDestroyActionProps());
      await result.current.onClick();
      expect(mock.history.post).toHaveLength(1);
      const url = new URL(api.axios.getUri(mock.history.post[0]));
      expect(url.pathname).toBe('/api/orgs/110013/users:destroy');
      expect(url.searchParams.get('filterByTk')).toBe('S1523968');
      expect(url.searchParams.has('filterByTk[code]')).toBe(false);
      expect(url.searchParams.has('filterByTk[staffname]')).toBe(false);
    } finally {
      mock.restore();
    }
  });

  it.each([
    '["A","B"]',
    '{"code":"A"}',
    '{"0":"A","1":"B"}',
    '[]',
    '{}',
    ' \n ["A","B"] \t',
    '[not JSON',
    '{not JSON',
    '["中文 & + %", "B"]',
  ])('preserves the literal hasMany key %s through server query parsing', async (key) => {
    state.record.code = key;
    const api = new APIClient({ baseURL: 'http://localhost/api/' });
    const mock = new MockAdapter(api.axios);
    mock.onPost('orgs/110013/users:destroy').reply(200, { data: true });
    state.resource.destroy = vi.fn((params: ActionParams) => api.resource('orgs.users', '110013').destroy(params));
    try {
      const { result } = renderHook(() => useDestroyActionProps());
      await result.current.onClick();
      expect(mock.history.post).toHaveLength(1);
      const config = mock.history.post[0];
      const paramsSerializer =
        typeof config.paramsSerializer === 'function'
          ? { serialize: config.paramsSerializer }
          : config.paramsSerializer;
      const url = new URL(api.axios.getUri({ ...config, paramsSerializer }));
      expect(url.pathname).toBe('/api/orgs/110013/users:destroy');
      expect(parseQuery(url.search.slice(1)).filterByTk).toEqual([key]);
    } finally {
      mock.restore();
    }
  });

  it.each([undefined, 'belongsToMany', 'hasOne', 'belongsTo'])(
    'does not wrap scalar keys outside hasMany: %s',
    async (type) => {
      state.associationName = type ? 'orgs.users' : undefined;
      state.association = type ? { type, targetKey: 'code' } : undefined;
      state.record.code = '["A","B"]';
      state.filterByTk = state.record.code;
      const { result } = renderHook(() => useDestroyActionProps());
      await result.current.onClick();
      expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: '["A","B"]' }));
    },
  );

  it('supports an uppercase target key', async () => {
    state.association = { type: 'hasMany', targetKey: 'ID' };
    state.record = { ID: '5000475' };
    state.filterByTk = { ID: '5000475' };
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: '5000475' }));
  });

  it.each([0, 42, '0'])('preserves the scalar target value %s', async (value) => {
    state.record.code = value;
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: value }));
  });

  it.each([undefined, null, '', {}, [], false, NaN, Infinity])(
    'does not submit an invalid target value %s',
    async (value) => {
      state.record.code = value;
      const showError = vi.spyOn(message, 'error').mockImplementation(() => undefined);
      const { result } = renderHook(() => useDestroyActionProps());
      await result.current.onClick();
      expect(state.resource.destroy).not.toHaveBeenCalled();
      expect(showError).toHaveBeenCalledOnce();
      expect(state.setSubmitted).not.toHaveBeenCalled();
      expect(state.actionField.data.loading).toBeUndefined();
    },
  );

  it('preserves a normal collection object identifier', async () => {
    state.associationName = undefined;
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: state.filterByTk }));
  });

  it.each(['belongsToMany', 'hasOne', 'belongsTo'])('preserves identifiers for %s', async (type) => {
    state.association = { type, targetKey: 'code' };
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: state.filterByTk }));
  });

  it.each([undefined, ['code', 'staffname']])(
    'preserves identifiers without a single association target key',
    async (key) => {
      state.association = { type: 'hasMany', targetKey: key };
      const { result } = renderHook(() => useDestroyActionProps());
      await result.current.onClick();
      expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: state.filterByTk }));
    },
  );

  it('preserves a TableFieldResource row index', async () => {
    vi.spyOn(CollectionManagerProvider, 'useCollectionManager').mockReturnValue(null);
    const resource = new TableFieldResource({ api: new APIClient(), resource: 'orgs.users' });
    state.resource = Object.assign(resource, {
      destroy: vi.fn().mockResolvedValue(true),
    });
    state.filterByTk = 0;
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 0 }));
  });

  it('preserves the row index within a parent TableField', async () => {
    state.parent.block = 'TableField';
    state.filterByTk = 0;
    const { result } = renderHook(() => useDestroyActionProps());
    await result.current.onClick();
    expect(state.resource.destroy).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 0 }));
  });
});
