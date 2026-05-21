/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { FlowModelRepository } from '../FlowModelRepository';

describe('FlowModelRepository', () => {
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
