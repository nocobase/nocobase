/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models';

describe('FlowEngine destroyModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ FlowModel });
  });

  it('calls repository.destroy when repository exists and emits onSubModelDestroyed on parent', async () => {
    const parent = engine.createModel({ uid: 'parent', use: 'FlowModel' });
    const child = engine.createModel({
      uid: 'child',
      use: 'FlowModel',
      parentId: 'parent',
      subKey: 'child',
      subType: 'object',
    });

    const repo = { destroy: vi.fn().mockResolvedValue(true) } as any;
    (engine as any)._modelRepository = repo;

    const emitSpy = vi.spyOn(parent.emitter, 'emit');

    const res = await engine.destroyModel('child');

    expect(repo.destroy).toHaveBeenCalledWith('child');
    expect(res).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith('onSubModelDestroyed', child);
  });

  it('emits onSubModelDestroyed even if there is no repository', async () => {
    const parent = engine.createModel({ uid: 'parent', use: 'FlowModel' });
    const child = engine.createModel({
      uid: 'child',
      use: 'FlowModel',
      parentId: 'parent',
      subKey: 'child',
      subType: 'object',
    });

    // ensure no repository
    (engine as any)._modelRepository = null;

    const emitSpy = vi.spyOn(parent.emitter, 'emit');

    const res = await engine.destroyModel('child');

    expect(res).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith('onSubModelDestroyed', child);
  });

  it('returns false when destroying a non-existent model but still calls repo.destroy if repo exists', async () => {
    const repo = { destroy: vi.fn().mockResolvedValue(true) } as any;
    (engine as any)._modelRepository = repo;

    const res = await engine.destroyModel('no-such-uid');

    expect(repo.destroy).toHaveBeenCalledWith('no-such-uid');
    expect(res).toBe(false);
  });
});
