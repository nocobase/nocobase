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
import '../../../index';
import { CollectionBlockModel } from '../CollectionBlockModel';
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

  it('skips forced active refresh in manual mode when filters are empty', async () => {
    const { model, resource } = setupModelWithManualMode();
    const refreshSpy = vi.spyOn(resource, 'refresh');

    resource.setData([{ id: 2, name: 'Stale' }]);
    resource.setMeta({ count: 1, hasNext: true, page: 2 });
    resource.loading = true;

    model.onActive(true);
    await Promise.resolve();
    await Promise.resolve();

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(resource.getData()).toEqual([]);
    expect(resource.getMeta('count')).toBe(0);
    expect(resource.getMeta('hasNext')).toBe(false);
    expect(resource.getMeta('page')).toBe(1);
    expect(resource.loading).toBe(false);
  });

  it('keeps forced active refresh in manual mode when filters are active', async () => {
    const { model, resource } = setupModelWithManualMode();
    const refreshSpy = vi.spyOn(resource, 'refresh').mockResolvedValue();

    resource.setData([{ id: 2, name: 'Stale' }]);
    resource.setMeta({ count: 1, hasNext: true, page: 2 });
    model.setFilterActive('filter-form-item', true);

    model.onActive(true);
    await Promise.resolve();

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(resource.getData()).toEqual([{ id: 2, name: 'Stale' }]);
    expect(resource.getMeta('count')).toBe(1);
  });

  it('skips forced active refresh in manual mode when only resource filters are active', async () => {
    const { model, resource } = setupModelWithManualMode();
    const refreshSpy = vi.spyOn(resource, 'refresh');

    resource.setData([{ id: 2, name: 'Stale' }]);
    resource.setMeta({ count: 1, hasNext: true, page: 2 });
    resource.loading = true;
    resource.addFilterGroup('data-scope', { status: { $eq: 'active' } });

    model.onActive(true);
    await Promise.resolve();

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(resource.getData()).toEqual([]);
    expect(resource.getMeta('count')).toBe(0);
    expect(resource.getMeta('hasNext')).toBe(false);
    expect(resource.getMeta('page')).toBe(1);
    expect(resource.loading).toBe(false);
  });
});
