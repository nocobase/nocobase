/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import type { BaseApplication } from '../../BaseApplication';
import { FlowModelRepository, loadRouteContentForEditing } from '../FlowModelRepository';

describe('FlowModelRepository', () => {
  it('keeps the browse UID when the route parent is outside the current engine', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FlowModel });
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { data: 'browse-uid' } })
      .mockResolvedValueOnce({
        data: { data: { uid: 'browse-uid', use: 'FlowModel', parentId: 'route', subKey: 'page' } },
      });
    engine.setModelRepository(new FlowModelRepository({ apiClient: { request } } as unknown as BaseApplication));
    const options = { use: 'FlowModel', parentId: 'route', subKey: 'page', subType: 'object' as const };
    const browsing = engine.createModel({ ...options, uid: 'browse-uid' });
    expect(await loadRouteContentForEditing(engine, options)).toBe(browsing);
    expect(await loadRouteContentForEditing(engine, options)).toBe(browsing);
    expect(request).toHaveBeenCalledTimes(3);
    expect(request.mock.calls[1][0].data).toMatchObject({ ...options, uid: browsing.uid });
  });

  it('retries the first edit when the initialization request fails', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FlowModel });
    const options = { use: 'FlowModel', parentId: 'route', subKey: 'page', subType: 'object' as const };
    const model = engine.createModel({ ...options, uid: 'browse-uid' });
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: {} })
      .mockRejectedValueOnce(new Error('Save failed'))
      .mockResolvedValueOnce({ data: { data: { ...options, uid: model.uid } } });
    engine.setModelRepository(new FlowModelRepository({ apiClient: { request } } as unknown as BaseApplication));
    await expect(loadRouteContentForEditing(engine, options)).rejects.toThrow('Save failed');
    expect(await loadRouteContentForEditing(engine, options)).toBe(model);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('dedupes concurrent findOne requests with same key', async () => {
    const request = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return {
        data: {
          data: {
            uid: 'u1',
            stepParams: { a: 1, nested: { b: 2 } },
            subModels: { grid: { uid: 'g1', stepParams: { c: 3 } } },
          },
        },
      };
    });

    const repo = new FlowModelRepository({ apiClient: { request } } as any);
    const [a, b] = await Promise.all([repo.findOne({ uid: 'u1' }), repo.findOne({ uid: 'u1', foo: 'bar' })]);

    expect(request).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.stepParams).not.toBe(b.stepParams);
    expect(a.stepParams.nested).not.toBe(b.stepParams.nested);
  });

  it('does not cache after the in-flight promise resolves', async () => {
    const request = vi.fn(async () => ({ data: { data: { uid: 'u1', stepParams: { a: 1 } } } }));
    const repo = new FlowModelRepository({ apiClient: { request } } as any);

    await repo.findOne({ uid: 'u1' });
    await repo.findOne({ uid: 'u1' });

    expect(request).toHaveBeenCalledTimes(2);
  });

  it('clears in-flight entry when request rejects', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ data: { data: { uid: 'u1' } } });

    const repo = new FlowModelRepository({ apiClient: { request } } as any);

    await expect(repo.findOne({ uid: 'u1' })).rejects.toThrow('boom');
    await expect(repo.findOne({ uid: 'u1' })).resolves.toEqual({ uid: 'u1' });

    expect(request).toHaveBeenCalledTimes(2);
  });
});
