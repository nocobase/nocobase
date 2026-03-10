/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { DetailsBlockModel, DetailsGridModel } from '@nocobase/client';

function setupDetailsBlockModel(options?: { filterByTk?: string | number }) {
  const engine = new FlowEngine();
  engine.context.defineProperty('location', { value: { search: '' } as any });
  engine.registerModels({ DetailsBlockModel, DetailsGridModel });

  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'input' },
      { name: 'title', type: 'string', interface: 'input' },
    ],
  });

  const model = engine.createModel<DetailsBlockModel>({
    uid: `details-${options?.filterByTk ?? 'multi'}`,
    use: 'DetailsBlockModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          ...(typeof options?.filterByTk !== 'undefined' ? { filterByTk: options.filterByTk } : {}),
        },
      },
    },
  });

  return {
    engine,
    model,
    resource: model.resource,
  };
}

describe('DetailsBlockModel initial pagination refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses a real paginated details model and emits root paginationChange once after initial refresh', async () => {
    const { model, resource } = setupDetailsBlockModel();
    expect(resource).toBeInstanceOf(MultiRecordResource);

    const dispatchSpy = vi.spyOn(model, 'dispatchEvent');
    const refreshSpy = vi.spyOn(resource, 'refresh').mockImplementation(async () => {
      resource.setData([{ id: 1, name: 'AA', title: 'foo' }] as any);
      resource.setMeta({ count: 2, page: 1, pageSize: 1, totalPage: 2 });
      resource.emit('refresh');
    });

    await model.dispatchEvent('beforeRender', undefined, { useCache: false });

    const paginationCallIndex = dispatchSpy.mock.calls.findIndex(([eventName]) => eventName === 'paginationChange');
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(paginationCallIndex).toBeGreaterThan(-1);
    expect(dispatchSpy.mock.calls.filter(([eventName]) => eventName === 'paginationChange')).toHaveLength(1);
    expect(refreshSpy.mock.invocationCallOrder[0]).toBeLessThan(
      dispatchSpy.mock.invocationCallOrder[paginationCallIndex],
    );
  });

  it('uses a real single-record details model and does not emit root paginationChange on initial render', async () => {
    const { model, resource } = setupDetailsBlockModel({ filterByTk: 1 });
    expect(resource).toBeInstanceOf(SingleRecordResource);

    const dispatchSpy = vi.spyOn(model, 'dispatchEvent');
    vi.spyOn(resource, 'refresh').mockImplementation(async () => {
      resource.setData({ id: 1, name: 'AA', title: 'foo' } as any);
      resource.emit('refresh');
    });

    await model.dispatchEvent('beforeRender', undefined, { useCache: false });

    expect(dispatchSpy.mock.calls.filter(([eventName]) => eventName === 'paginationChange')).toHaveLength(0);
  });
});
