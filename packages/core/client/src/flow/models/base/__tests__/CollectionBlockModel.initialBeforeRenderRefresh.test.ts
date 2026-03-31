/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import { CollectionBlockModel } from '@nocobase/client';
import { dataLoadingMode } from '../../../actions/dataLoadingMode';

class InitialBeforeRenderTestBlockModel extends CollectionBlockModel {
  createResource(ctx: any, _params: any) {
    return ctx.createResource(MultiRecordResource);
  }
}

function setupModel() {
  const engine = new FlowEngine();
  engine.context.defineProperty('location', { value: { search: '' } as any });
  engine.registerActions({ dataLoadingMode });
  engine.registerModels({ InitialBeforeRenderTestBlockModel });

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'input' },
    ],
  });

  const model = engine.createModel<InitialBeforeRenderTestBlockModel>({
    uid: 'initial-before-render-block',
    use: 'InitialBeforeRenderTestBlockModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      },
    },
  });

  return { model, resource: model.resource as MultiRecordResource };
}

function setupModelWithManualMode() {
  const engine = new FlowEngine();
  engine.context.defineProperty('location', { value: { search: '' } as any });
  engine.registerActions({ dataLoadingMode });
  engine.registerModels({ InitialBeforeRenderTestBlockModel });

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'input' },
    ],
  });

  const model = engine.createModel<InitialBeforeRenderTestBlockModel>({
    uid: 'manual-before-render-block',
    use: 'InitialBeforeRenderTestBlockModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      },
      dataLoadingModeSettings: {
        dataLoadingMode: {
          mode: 'manual',
        },
      },
    },
  });

  return { model, resource: model.resource as MultiRecordResource };
}

describe('CollectionBlockModel initial beforeRender refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only performs one actual data request on first beforeRender', async () => {
    const { model, resource } = setupModel();
    const runActionSpy = vi.spyOn(resource, 'runAction').mockResolvedValue({
      data: [{ id: 1, name: 'Alice' }],
      meta: { count: 1, hasNext: false, page: 1, pageSize: 20 },
    });

    const renderPromise = model.dispatchEvent('beforeRender', undefined, { useCache: false });
    await vi.runAllTimersAsync();
    await renderPromise;
    await vi.advanceTimersByTimeAsync(150);

    expect(runActionSpy).toHaveBeenCalledTimes(1);
  });

  it('respects saved manual mode and skips initial request when filters are empty', async () => {
    const { model, resource } = setupModelWithManualMode();
    const runActionSpy = vi.spyOn(resource, 'runAction').mockResolvedValue({
      data: [{ id: 1, name: 'Alice' }],
      meta: { count: 1, hasNext: false, page: 1, pageSize: 20 },
    });

    const renderPromise = model.dispatchEvent('beforeRender', undefined, { useCache: false });
    await vi.runAllTimersAsync();
    await renderPromise;
    await vi.advanceTimersByTimeAsync(150);

    expect(runActionSpy).not.toHaveBeenCalled();
    expect(resource.getData()).toEqual([]);
    expect(resource.getMeta('count')).toBe(0);
  });
});
