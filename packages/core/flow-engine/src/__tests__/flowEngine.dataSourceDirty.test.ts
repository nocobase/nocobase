/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { MultiRecordResource } from '../resources/multiRecordResource';
import { SingleRecordResource } from '../resources/singleRecordResource';

describe('FlowEngine dataSource dirty registry', () => {
  it('tracks versions per dataSourceKey + resourceName', () => {
    const engine = new FlowEngine();

    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(0);
    expect(engine.markDataSourceDirty('main', 'posts')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);

    expect(engine.markDataSourceDirty('main', 'posts')).toBe(2);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(2);

    // different resource
    expect(engine.getDataSourceDirtyVersion('main', 'users')).toBe(0);
    expect(engine.markDataSourceDirty('main', 'users')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'users')).toBe(1);

    // different data source
    expect(engine.getDataSourceDirtyVersion('ds2', 'posts')).toBe(0);
    expect(engine.markDataSourceDirty('ds2', 'posts')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('ds2', 'posts')).toBe(1);
    // main unchanged
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(2);
  });

  it('marks dirty on record write operations (single & multi)', async () => {
    const engine = new FlowEngine();
    const markSpy = vi.spyOn(engine, 'markDataSourceDirty');

    const single = engine.createResource(SingleRecordResource);
    single.setDataSourceKey('main');
    single.setResourceName('posts');
    // avoid network: stub runAction + refresh
    (single as any).runAction = vi.fn().mockResolvedValue({ data: {}, meta: {} });
    (single as any).refresh = vi.fn().mockResolvedValue(undefined);
    await single.save({ title: 't' } as any, { refresh: false });
    expect(markSpy).toHaveBeenCalledWith('main', 'posts');

    const multi = engine.createResource(MultiRecordResource);
    multi.setDataSourceKey('main');
    multi.setResourceName('users.profile');
    (multi as any).runAction = vi.fn().mockResolvedValue({ data: [], meta: {} });
    (multi as any).refresh = vi.fn().mockResolvedValue(undefined);
    await multi.create({ name: 'n' } as any, { refresh: false });
    // exact association
    expect(markSpy).toHaveBeenCalledWith('main', 'users.profile');
    // plus root collection (safety)
    expect(markSpy).toHaveBeenCalledWith('main', 'users');
  });
});
