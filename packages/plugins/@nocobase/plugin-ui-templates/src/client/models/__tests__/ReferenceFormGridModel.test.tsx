/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, it, expect, vi } from 'vitest';
import { ReferenceFormGridModel } from '../ReferenceFormGridModel';

class MockFormBlockModel extends FlowModel {}
class MockGridModel extends FlowModel {}
class MockFieldModel extends FlowModel {}

describe('ReferenceFormGridModel', () => {
  it('proxies subModels to template grid but serializes as leaf', async () => {
    const engine = new FlowEngine();
    const store: Record<string, any> = {
      'tpl-root': {
        uid: 'tpl-root',
        use: 'FormBlockModel',
        subModels: {
          grid: {
            uid: 'tpl-grid',
            use: 'GridModel',
            subKey: 'grid',
            subType: 'object',
            subModels: {
              items: [
                { uid: 'tpl-f1', use: 'FieldModel', subKey: 'items', subType: 'array' },
                { uid: 'tpl-f2', use: 'FieldModel', subKey: 'items', subType: 'array' },
              ],
            },
          },
        },
      },
    };

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => ({ uid: typeof model?.uid === 'string' ? model.uid : (model?.uid as any) })),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    };

    engine.setModelRepository(mockRepository as any);
    engine.registerModels({
      FormBlockModel: MockFormBlockModel,
      GridModel: MockGridModel,
      FieldModel: MockFieldModel,
      ReferenceFormGridModel,
    });

    const form = engine.createModel({
      uid: 'host-form',
      use: 'FormBlockModel',
    });

    const refGrid = engine.createModel({
      uid: 'host-grid',
      use: 'ReferenceFormGridModel',
      parentId: form.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: {
        referenceSettings: {
          useTemplate: {
            templateUid: 'tpl-1',
            targetUid: 'tpl-root',
            targetPath: 'subModels.grid',
            mode: 'reference',
          },
        },
      },
    });
    form.setSubModel('grid', refGrid);

    await refGrid.dispatchEvent('beforeRender', undefined, { useCache: false });

    const items = ((refGrid as any).subModels as any)?.items as FlowModel[];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(2);
    expect(items.map((m) => m.uid).sort()).toEqual(['tpl-f1', 'tpl-f2']);

    const serialized = refGrid.serialize();
    expect(serialized.subModels).toBeUndefined();
  });

  it('bridges host context (record) to referenced grid while keeping scoped engine', async () => {
    const engine = new FlowEngine();
    const store: Record<string, any> = {
      'tpl-root': {
        uid: 'tpl-root',
        use: 'DetailsBlockModel',
        subModels: {
          grid: {
            uid: 'tpl-grid',
            use: 'DetailsGridModel',
            subKey: 'grid',
            subType: 'object',
            subModels: {
              items: [{ uid: 'tpl-i1', use: 'ItemModel', subKey: 'items', subType: 'array' }],
            },
          },
        },
      },
    };

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => ({ uid: typeof model?.uid === 'string' ? model.uid : (model?.uid as any) })),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    };

    class HostDetailsBlockModel extends FlowModel {}
    class DetailsBlockModel extends FlowModel {}
    class DetailsGridModel extends FlowModel {}
    class ItemModel extends FlowModel {}

    engine.setModelRepository(mockRepository as any);
    engine.registerModels({
      HostDetailsBlockModel,
      DetailsBlockModel,
      DetailsGridModel,
      ItemModel,
      ReferenceFormGridModel,
    });

    const host = engine.createModel<HostDetailsBlockModel>({
      uid: 'host-details',
      use: 'HostDetailsBlockModel',
    });
    host.context.defineProperty('record', { value: { username: 'nocobase' } });

    const refGrid = engine.createModel({
      uid: 'host-grid',
      use: 'ReferenceFormGridModel',
      parentId: host.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: {
        referenceSettings: {
          useTemplate: {
            templateUid: 'tpl-1',
            targetUid: 'tpl-root',
            targetPath: 'subModels.grid',
            mode: 'reference',
          },
        },
      },
    });
    host.setSubModel('grid', refGrid);

    await refGrid.dispatchEvent('beforeRender', undefined, { useCache: false });

    const items = ((refGrid as any).subModels as any)?.items as FlowModel[];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(1);
    expect(items[0].context.record).toEqual({ username: 'nocobase' });

    // 引用渲染应仍使用 scoped engine（避免丢失模型实例/缓存隔离）
    const scoped = (refGrid as any)._scopedEngine;
    expect(scoped).toBeTruthy();
    expect(items[0].context.engine).toBe(scoped);
  });

  it('delegates layout + linkage rules stepParams to template grid (legacy fallback to template root)', async () => {
    const engine = new FlowEngine();
    const store: Record<string, any> = {
      'tpl-root': {
        uid: 'tpl-root',
        use: 'FormBlockModel',
        stepParams: {
          formModelSettings: {
            layout: {
              layout: 'horizontal',
              labelAlign: 'right',
              labelWidth: 160,
              labelWrap: false,
              colon: false,
            },
          },
          eventSettings: {
            linkageRules: {
              value: [
                {
                  key: 'r1',
                  title: 'Rule 1',
                  enable: true,
                  condition: { $and: [] },
                  actions: [],
                },
              ],
            },
          },
        },
        subModels: {
          grid: {
            uid: 'tpl-grid',
            use: 'GridModel',
            subKey: 'grid',
            subType: 'object',
            stepParams: {},
            subModels: {
              items: [],
            },
          },
        },
      },
    };

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => ({ uid: typeof model?.uid === 'string' ? model.uid : (model?.uid as any) })),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    };

    class HostFormBlockModel extends FlowModel {}
    class GridModel extends FlowModel {}

    engine.setModelRepository(mockRepository as any);
    engine.registerModels({
      HostFormBlockModel,
      FormBlockModel: MockFormBlockModel,
      GridModel,
      ReferenceFormGridModel,
    });

    const host = engine.createModel<HostFormBlockModel>({
      uid: 'host-form',
      use: 'HostFormBlockModel',
    });

    const refGrid = engine.createModel({
      uid: 'host-grid',
      use: 'ReferenceFormGridModel',
      parentId: host.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: {
        referenceSettings: {
          useTemplate: {
            templateUid: 'tpl-1',
            targetUid: 'tpl-root',
            targetPath: 'subModels.grid',
            mode: 'reference',
          },
        },
      },
    });
    host.setSubModel('grid', refGrid);

    await refGrid.dispatchEvent('beforeRender', undefined, { useCache: false });

    // legacy: params live on template root, ReferenceFormGridModel should read them as fallback
    expect(refGrid.getStepParams('formModelSettings', 'layout')).toEqual({
      layout: 'horizontal',
      labelAlign: 'right',
      labelWidth: 160,
      labelWrap: false,
      colon: false,
    });

    expect(refGrid.getStepParams('eventSettings', 'linkageRules')).toEqual({
      value: [
        {
          key: 'r1',
          title: 'Rule 1',
          enable: true,
          condition: { $and: [] },
          actions: [],
        },
      ],
    });

    // new: write to template grid
    refGrid.setStepParams('formModelSettings', 'layout', {
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 120,
      labelWrap: true,
      colon: true,
    });
    refGrid.setStepParams('eventSettings', 'linkageRules', { value: [] });

    expect(refGrid.getStepParams('formModelSettings', 'layout')).toEqual({
      layout: 'vertical',
      labelAlign: 'left',
      labelWidth: 120,
      labelWrap: true,
      colon: true,
    });
    expect(refGrid.getStepParams('eventSettings', 'linkageRules')).toEqual({ value: [] });

    await refGrid.saveStepParams();
    const savedUids = mockRepository.save.mock.calls.map((c) => c[0]?.uid).sort();
    expect(savedUids).toContain('host-grid');
    expect(savedUids).toContain('tpl-grid');
  });

  it('flushes local (pre-resolve) stepParams to template grid on resolve/save', async () => {
    const engine = new FlowEngine();
    const store: Record<string, any> = {
      'tpl-root': {
        uid: 'tpl-root',
        use: 'FormBlockModel',
        subModels: {
          grid: {
            uid: 'tpl-grid',
            use: 'GridModel',
            subKey: 'grid',
            subType: 'object',
            stepParams: {},
            subModels: { items: [] },
          },
        },
      },
    };

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => ({ uid: typeof model?.uid === 'string' ? model.uid : (model?.uid as any) })),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    };

    class HostFormBlockModel extends FlowModel {}
    class GridModel extends FlowModel {}

    engine.setModelRepository(mockRepository as any);
    engine.registerModels({
      HostFormBlockModel,
      GridModel,
      ReferenceFormGridModel,
    });

    const host = engine.createModel<HostFormBlockModel>({
      uid: 'host-form',
      use: 'HostFormBlockModel',
    });

    const refGrid = engine.createModel({
      uid: 'host-grid',
      use: 'ReferenceFormGridModel',
      parentId: host.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: {
        referenceSettings: {
          useTemplate: {
            templateUid: 'tpl-1',
            targetUid: 'tpl-root',
            targetPath: 'subModels.grid',
            mode: 'reference',
          },
        },
      },
    });
    host.setSubModel('grid', refGrid);

    // before target grid resolved, setStepParams should land in local (host-grid) stepParams first
    refGrid.setStepParams('eventSettings', 'linkageRules', { value: [{ key: 'pre' }] });
    expect((refGrid as any).stepParams?.eventSettings?.linkageRules).toEqual({ value: [{ key: 'pre' }] });

    // save should resolve target, flush local params into template grid, then persist both
    await refGrid.saveStepParams();

    const targetGrid = (refGrid as any)._targetGrid as FlowModel;
    expect(targetGrid).toBeTruthy();
    expect(targetGrid.getStepParams('eventSettings', 'linkageRules')).toEqual({ value: [{ key: 'pre' }] });
    expect((refGrid as any).stepParams?.eventSettings).toBeUndefined();

    const savedUids = mockRepository.save.mock.calls.map((c) => c[0]?.uid).sort();
    expect(savedUids).toContain('host-grid');
    expect(savedUids).toContain('tpl-grid');
  });

  it('bridges host context (record) to referenced grid while keeping scoped engine', async () => {
    const engine = new FlowEngine();
    const store: Record<string, any> = {
      'tpl-root': {
        uid: 'tpl-root',
        use: 'DetailsBlockModel',
        subModels: {
          grid: {
            uid: 'tpl-grid',
            use: 'DetailsGridModel',
            subKey: 'grid',
            subType: 'object',
            subModels: {
              items: [{ uid: 'tpl-i1', use: 'ItemModel', subKey: 'items', subType: 'array' }],
            },
          },
        },
      },
    };

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => ({ uid: typeof model?.uid === 'string' ? model.uid : (model?.uid as any) })),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    };

    class HostDetailsBlockModel extends FlowModel {}
    class DetailsBlockModel extends FlowModel {}
    class DetailsGridModel extends FlowModel {}
    class ItemModel extends FlowModel {}

    engine.setModelRepository(mockRepository as any);
    engine.registerModels({
      HostDetailsBlockModel,
      DetailsBlockModel,
      DetailsGridModel,
      ItemModel,
      ReferenceFormGridModel,
    });

    const host = engine.createModel<HostDetailsBlockModel>({
      uid: 'host-details',
      use: 'HostDetailsBlockModel',
    });
    host.context.defineProperty('record', { value: { username: 'nocobase' } });

    const refGrid = engine.createModel({
      uid: 'host-grid',
      use: 'ReferenceFormGridModel',
      parentId: host.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: {
        referenceSettings: {
          useTemplate: {
            templateUid: 'tpl-1',
            targetUid: 'tpl-root',
            targetPath: 'subModels.grid',
            mode: 'reference',
          },
        },
      },
    });
    host.setSubModel('grid', refGrid);

    await refGrid.dispatchEvent('beforeRender', undefined, { useCache: false });

    const items = ((refGrid as any).subModels as any)?.items as FlowModel[];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(1);
    expect(items[0].context.record).toEqual({ username: 'nocobase' });

    // 引用渲染应仍使用 scoped engine（避免丢失模型实例/缓存隔离）
    const scoped = (refGrid as any)._scopedEngine;
    expect(scoped).toBeTruthy();
    expect(items[0].context.engine).toBe(scoped);
  });

  it('syncs host extraTitle with reference template info', async () => {
    MockFormBlockModel.define({
      label: '默认block title',
    });

    const engine = new FlowEngine();
    const store: Record<string, any> = {
      'tpl-root': {
        uid: 'tpl-root',
        use: 'FormBlockModel',
        subModels: {
          grid: {
            uid: 'tpl-grid',
            use: 'GridModel',
            subKey: 'grid',
            subType: 'object',
            subModels: { items: [] },
          },
        },
      },
    };

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => ({ uid: typeof model?.uid === 'string' ? model.uid : (model?.uid as any) })),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    };

    engine.setModelRepository(mockRepository as any);
    engine.registerModels({
      FormBlockModel: MockFormBlockModel,
      GridModel: MockGridModel,
      FieldModel: MockFieldModel,
      ReferenceFormGridModel,
    });

    const form = engine.createModel({
      uid: 'host-form',
      use: 'FormBlockModel',
    });

    const refGrid = engine.createModel({
      uid: 'host-grid',
      use: 'ReferenceFormGridModel',
      parentId: form.uid,
      subKey: 'grid',
      subType: 'object',
      stepParams: {
        referenceSettings: {
          useTemplate: {
            templateUid: 'tpl-1',
            templateName: '模板名称',
            targetUid: 'tpl-root',
            targetPath: 'subModels.grid',
            mode: 'reference',
          },
        },
      },
    });
    form.setSubModel('grid', refGrid);

    await refGrid.dispatchEvent('beforeRender', undefined, { useCache: false });
    expect(form.title).toBe('默认block title');
    expect((form as any).extraTitle).toBe('Reference template: 模板名称 (Fields only)');

    // clear settings should restore base title
    (refGrid as any).stepParams.referenceSettings.useTemplate.templateUid = '';
    (refGrid as any).stepParams.referenceSettings.useTemplate.targetUid = '';
    await refGrid.dispatchEvent('beforeRender', undefined, { useCache: false });
    expect(form.title).toBe('默认block title');
    expect((form as any).extraTitle).toBe('');
  });
});
