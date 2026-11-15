/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Collection, FlowEngine, MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { APIClient } from '@nocobase/sdk';
import MockAdapter from 'axios-mock-adapter';
import { DeleteActionModel } from '../DeleteActionModel';
import { BulkDeleteActionModel } from '../BulkDeleteActionModel';
import { parseQuery } from '../../../../../../resourcer/src/utils';

type RecordData = Record<string, unknown>;

function setup(single = false) {
  const engine = new FlowEngine();
  const resource = single ? engine.createResource(SingleRecordResource) : engine.createResource(MultiRecordResource);
  const collection = new Collection({ name: 'users', filterTargetKey: ['code', 'staffname'] });
  const ctx = {
    record: { code: 'S1523968', staffname: 'Test user' } as RecordData,
    resource,
    blockModel: {
      resource,
      collection,
      association: { type: 'hasMany', targetKey: 'code' } as { type: string; targetKey?: unknown } | undefined,
    },
    message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
    t: (value: string) => value,
  };
  const model = new DeleteActionModel({ uid: 'delete', flowEngine: engine });
  const bulkModel = new BulkDeleteActionModel({ uid: 'bulk-delete', flowEngine: engine });
  const handler = model.getFlow('deleteSettings').getStep('delete').serialize().handler;
  const bulkHandler = bulkModel.getFlow('deleteSettings').getStep('delete').serialize().handler;
  return {
    ctx,
    resource,
    run: () => handler(ctx as Parameters<typeof handler>[0], {}),
    runBulk: () => bulkHandler(ctx as Parameters<typeof bulkHandler>[0], {}),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('hasMany delete actions', () => {
  it('uses the association target key when the collection has multiple identifier fields', async () => {
    const { ctx, resource, run } = setup();
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).toHaveBeenCalledWith('S1523968');
    expect(ctx.message.success).toHaveBeenCalledOnce();
  });

  it('uses the association target key when the collection identifier is a different scalar', async () => {
    const { ctx, resource, run } = setup();
    ctx.blockModel.collection = new Collection({ name: 'users', filterTargetKey: 'staffname' });
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).toHaveBeenCalledWith('S1523968');
  });

  it('supports uppercase target keys', async () => {
    const { ctx, resource, run } = setup();
    ctx.blockModel.association.targetKey = 'ID';
    ctx.record = { ID: 'A' };
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).toHaveBeenCalledWith('A');
  });

  it.each([0, '0', 42, '9223372036854775807'])('preserves target key %s', async (value) => {
    const { ctx, resource, run } = setup();
    ctx.record.code = value;
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).toHaveBeenCalledWith(value);
  });

  it.each([undefined, null, '', {}, [], false, NaN, Infinity])('rejects invalid target value %s', async (value) => {
    const { ctx, resource, run } = setup();
    ctx.record.code = value;
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).not.toHaveBeenCalled();
    expect(ctx.message.error).toHaveBeenCalledWith('The association target key is missing or invalid.');
    expect(ctx.message.success).not.toHaveBeenCalled();
  });

  it('rejects missing association target key metadata', async () => {
    const { ctx, resource, run } = setup();
    ctx.blockModel.association.targetKey = undefined;
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).not.toHaveBeenCalled();
    expect(ctx.message.error).toHaveBeenCalledOnce();
  });

  it.each([undefined, 'belongsToMany', 'hasOne', 'belongsTo'])('preserves identifiers for %s', async (type) => {
    const { ctx, resource, run } = setup();
    ctx.blockModel.association = type ? { type, targetKey: 'code' } : undefined;
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).toHaveBeenCalledWith(ctx.record);
  });

  it('preserves the existing call for a non-hasMany single record resource', async () => {
    const { ctx, resource, run } = setup(true);
    ctx.blockModel.association = undefined;
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await run();
    expect(destroy).toHaveBeenCalledWith(ctx.record);
  });

  it.each([false, true])('serializes a scalar URL with singleRecord=%s', async (single) => {
    const { ctx, resource, run } = setup(single);
    const api = new APIClient({ baseURL: 'http://localhost/api/' });
    const mock = new MockAdapter(api.axios);
    mock.onPost('orgs/110013/users:destroy').reply(200, { data: true });
    resource.setAPIClient(api).setResourceName('orgs.users').setSourceId('110013');
    resource.setFilterByTk(ctx.record);
    vi.spyOn(resource, 'refresh').mockResolvedValue();
    try {
      await run();
      expect(mock.history.post).toHaveLength(1);
      const url = new URL(api.axios.getUri(mock.history.post[0]));
      expect(url.pathname).toBe('/api/orgs/110013/users:destroy');
      expect(url.searchParams.get('filterByTk')).toBe('S1523968');
      expect(url.searchParams.has('filterByTk[code]')).toBe(false);
      expect(ctx.message.success).toHaveBeenCalledOnce();
    } finally {
      mock.restore();
    }
  });

  describe.each([false, true])('literal hasMany keys with singleRecord=%s', (single) => {
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
    ])('preserves %s through server query parsing', async (key) => {
      const { ctx, resource, run } = setup(single);
      ctx.record.code = key;
      const api = new APIClient({ baseURL: 'http://localhost/api/' });
      const mock = new MockAdapter(api.axios);
      mock.onPost('orgs/110013/users:destroy').reply(200, { data: true });
      resource.setAPIClient(api).setResourceName('orgs.users').setSourceId('110013');
      resource.setFilterByTk(ctx.record);
      vi.spyOn(resource, 'refresh').mockResolvedValue();
      try {
        await run();
        expect(mock.history.post).toHaveLength(1);
        const config = mock.history.post[0];
        const paramsSerializer =
          typeof config.paramsSerializer === 'function'
            ? { serialize: config.paramsSerializer }
            : config.paramsSerializer;
        const url = new URL(api.axios.getUri({ ...config, paramsSerializer }));
        expect(url.pathname).toBe('/api/orgs/110013/users:destroy');
        expect(parseQuery(url.search.slice(1)).filterByTk).toEqual([key]);
        expect(ctx.message.success).toHaveBeenCalledOnce();
      } finally {
        mock.restore();
      }
    });
  });

  it.each([undefined, 'belongsToMany', 'hasOne', 'belongsTo'])(
    'does not wrap scalar keys outside hasMany: %s',
    async (type) => {
      const { ctx, resource, run } = setup();
      ctx.blockModel.association = type ? { type, targetKey: 'code' } : undefined;
      ctx.blockModel.collection = new Collection({ name: 'users', filterTargetKey: 'code' });
      ctx.record.code = '["A","B"]';
      const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
      await run();
      expect(destroy).toHaveBeenCalledWith('["A","B"]');
    },
  );

  it('preserves special string elements in a hasMany bulk request', async () => {
    const { resource, runBulk } = setup();
    const keys = ['["A","B"]', '{"code":"A"}'];
    (resource as MultiRecordResource).setSelectedRows(keys.map((code) => ({ code })));
    const api = new APIClient({ baseURL: 'http://localhost/api/' });
    const mock = new MockAdapter(api.axios);
    mock.onPost('orgs/110013/users:destroy').reply(200, { data: true });
    resource.setAPIClient(api).setResourceName('orgs.users').setSourceId('110013');
    vi.spyOn(resource, 'refresh').mockResolvedValue();
    try {
      await runBulk();
      expect(mock.history.post).toHaveLength(1);
      const config = mock.history.post[0];
      const paramsSerializer =
        typeof config.paramsSerializer === 'function'
          ? { serialize: config.paramsSerializer }
          : config.paramsSerializer;
      const url = new URL(api.axios.getUri({ ...config, paramsSerializer }));
      expect(parseQuery(url.search.slice(1)).filterByTk).toEqual(keys);
    } finally {
      mock.restore();
    }
  });

  it('sends scalar target keys for selected hasMany records', async () => {
    const { resource, runBulk } = setup();
    const rows = [
      { code: 'A', staffname: 'a' },
      { code: 'B', staffname: 'b' },
    ];
    (resource as MultiRecordResource).setSelectedRows(rows);
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await runBulk();
    expect(destroy).toHaveBeenCalledWith(['A', 'B']);
  });

  it('rejects the entire batch when one selected row has no target key', async () => {
    const { ctx, resource, runBulk } = setup();
    (resource as MultiRecordResource).setSelectedRows([{ code: 'A' }, { staffname: 'b' }]);
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await runBulk();
    expect(destroy).not.toHaveBeenCalled();
    expect(ctx.message.error).toHaveBeenCalledOnce();
    expect(ctx.message.success).not.toHaveBeenCalled();
  });

  it('preserves collection identifiers for other bulk deletion', async () => {
    const { ctx, resource, runBulk } = setup();
    ctx.blockModel.association = { type: 'belongsToMany', targetKey: 'code' };
    const rows = [
      { code: 'A', staffname: 'a' },
      { code: 'B', staffname: 'b' },
    ];
    (resource as MultiRecordResource).setSelectedRows(rows);
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await runBulk();
    expect(destroy).toHaveBeenCalledWith(rows);
  });

  it('does not delete an empty selection', async () => {
    const { ctx, resource, runBulk } = setup();
    const destroy = vi.spyOn(resource, 'destroy').mockResolvedValue();
    await runBulk();
    expect(destroy).not.toHaveBeenCalled();
    expect(ctx.message.warning).toHaveBeenCalledOnce();
  });
});
