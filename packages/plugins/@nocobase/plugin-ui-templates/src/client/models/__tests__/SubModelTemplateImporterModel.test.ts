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
import { SubModelTemplateImporterModel, resolveExpectedRootUse } from '../SubModelTemplateImporterModel';

describe('resolveExpectedRootUse', () => {
  it('allows ApplyFormModel and ProcessFormModel to share templates', () => {
    expect(resolveExpectedRootUse({ use: 'ApplyFormModel' } as FlowModel)).toEqual([
      'ApplyFormModel',
      'ProcessFormModel',
    ]);
    expect(resolveExpectedRootUse({ use: 'ProcessFormModel' } as FlowModel)).toEqual([
      'ApplyFormModel',
      'ProcessFormModel',
    ]);
  });

  it('keeps CreateFormModel and EditFormModel sharing behavior', () => {
    expect(resolveExpectedRootUse({ use: 'CreateFormModel' } as FlowModel)).toEqual([
      'CreateFormModel',
      'EditFormModel',
    ]);
    expect(resolveExpectedRootUse({ use: 'EditFormModel' } as FlowModel)).toEqual(['CreateFormModel', 'EditFormModel']);
  });
});

describe('SubModelTemplateImporterModel', () => {
  it('stores derived targetUid into stepParams in beforeParamsSave', async () => {
    const engine = new FlowEngine();

    class FormBlockModel extends FlowModel {}
    class GridModel extends FlowModel {}

    engine.registerModels({
      FormBlockModel,
      GridModel,
      SubModelTemplateImporterModel,
    });

    const form = engine.createModel<FormBlockModel>({ uid: 'host-form', use: 'FormBlockModel' });
    const grid = engine.createModel<GridModel>({
      uid: 'host-grid',
      use: 'GridModel',
      parentId: form.uid,
      subKey: 'grid',
      subType: 'object',
    });
    form.setSubModel('grid', grid);

    const importer = engine.createModel<SubModelTemplateImporterModel>({
      uid: 'importer-1',
      use: 'SubModelTemplateImporterModel',
      parentId: grid.uid,
      subKey: 'items',
      subType: 'array',
    });
    importer.setParent(grid);

    const flow: any = importer.getFlow('subModelTemplateImportSettings');
    const step: any = flow?.getStep?.('selectTemplate')?.serialize?.();
    expect(typeof step?.beforeParamsSave).toBe('function');

    const ctx: any = {
      model: importer,
      api: {
        resource: (name: string) => {
          if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
          return {
            get: async () => ({ data: { data: { uid: 'tpl-1', name: 'Template 1', targetUid: 'tpl-root' } } }),
          };
        },
      },
      t: (k: string) => k,
      message: { warning: vi.fn(), error: vi.fn() },
    };

    const params: any = { templateUid: 'tpl-1', mode: 'reference' };
    // FlowSettings.open 会在 beforeParamsSave 之前 setStepParams
    importer.setStepParams('subModelTemplateImportSettings', 'selectTemplate', params);
    await step.beforeParamsSave(ctx, params);

    const saved = importer.getStepParams('subModelTemplateImportSettings', 'selectTemplate');
    expect(saved.templateUid).toBe('tpl-1');
    expect(saved.mode).toBe('reference');
    expect(saved.targetUid).toBe('tpl-root');
    expect(saved.templateName).toBe('Template 1');
  });

  it('filters by expectedRootUse and disables mismatched dataSource/collection', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ SubModelTemplateImporterModel });

    const importer = engine.createModel<SubModelTemplateImporterModel>({
      uid: 'importer-1',
      use: 'SubModelTemplateImporterModel',
      props: {
        expectedRootUse: ['CreateFormModel', 'EditFormModel'],
        expectedDataSourceKey: 'main',
        expectedCollectionName: 'orders',
      },
    });

    const list = vi.fn(async () => ({
      data: {
        rows: [
          {
            uid: 'tpl-mismatch',
            name: 'Mismatch',
            useModel: 'EditFormModel',
            dataSourceKey: 'main',
            collectionName: 'customers',
            targetUid: 'root-mis',
          },
          {
            uid: 'tpl-ok',
            name: 'OK',
            useModel: 'CreateFormModel',
            dataSourceKey: 'main',
            collectionName: 'orders',
            targetUid: 'root-ok',
          },
          {
            uid: 'tpl-other',
            name: 'Other',
            useModel: 'TableBlockModel',
            dataSourceKey: 'main',
            collectionName: 'orders',
            targetUid: 'root-other',
          },
        ],
      },
    }));

    const ctx: any = {
      api: {
        resource: () => ({ list }),
      },
      t: (k: string) => k,
    };

    const { options } = await (importer as any).fetchTemplateOptions(ctx, '');
    expect(Array.isArray(options)).toBe(true);

    const values = options.map((o: any) => o.value).sort();
    expect(values).toEqual(['tpl-mismatch', 'tpl-ok']);

    // enabled items should come first
    expect(options[0].value).toBe('tpl-ok');
    expect(options[0].disabled).toBe(false);
    expect(options[1].value).toBe('tpl-mismatch');
    expect(options[1].disabled).toBe(true);

    const mismatch = options.find((o: any) => o.value === 'tpl-mismatch');
    expect(mismatch.disabled).toBe(true);
    expect(String(mismatch.disabledReason || '')).toContain('Template collection mismatch');
  });

  it('resolves expected collection via associationName when collectionName is missing/wrong', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ SubModelTemplateImporterModel });

    const dsManager = engine.context.dataSourceManager;
    const main = dsManager.getDataSource('main');
    if (!main) throw new Error('missing main dataSource');
    main.collectionManager.addCollection({
      name: 'users',
      fields: [{ name: 'roles', type: 'hasMany', target: 'roles' }],
    });
    main.collectionManager.addCollection({ name: 'roles' });

    class FormBlockModel extends FlowModel {}
    engine.registerModels({ FormBlockModel });

    const form = engine.createModel<FormBlockModel>({
      uid: 'form',
      use: 'FormBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'bad',
            associationName: 'users.roles',
          },
        },
      },
    });

    const importer = engine.createModel<SubModelTemplateImporterModel>({
      uid: 'importer-1',
      use: 'SubModelTemplateImporterModel',
      parentId: form.uid,
      subKey: 'items',
      subType: 'array',
    });
    importer.setParent(form);

    const list = vi.fn(async () => ({
      data: {
        rows: [
          { uid: 'tpl-users', name: 'Users', dataSourceKey: 'main', collectionName: 'users', targetUid: 't1' },
          { uid: 'tpl-roles', name: 'Roles', dataSourceKey: 'main', collectionName: 'roles', targetUid: 't2' },
        ],
      },
    }));

    const ctx: any = {
      api: { resource: () => ({ list }) },
      t: (k: string) => k,
      dataSourceManager: dsManager,
    };

    const { options } = await (importer as any).fetchTemplateOptions(ctx, '');
    expect(options[0].value).toBe('tpl-roles');
    expect(options[0].disabled).toBe(false);
    expect(options[1].value).toBe('tpl-users');
    expect(options[1].disabled).toBe(true);
  });

  it('resolves template collection via associationName when template collectionName is missing/wrong', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ SubModelTemplateImporterModel });

    const dsManager = engine.context.dataSourceManager;
    const main = dsManager.getDataSource('main');
    if (!main) throw new Error('missing main dataSource');
    main.collectionManager.addCollection({
      name: 'users',
      fields: [{ name: 'roles', type: 'hasMany', target: 'roles' }],
    });
    main.collectionManager.addCollection({ name: 'roles' });

    const importer = engine.createModel<SubModelTemplateImporterModel>({
      uid: 'importer-1',
      use: 'SubModelTemplateImporterModel',
      props: {
        expectedDataSourceKey: 'main',
        expectedCollectionName: 'roles',
      },
    });

    const list = vi.fn(async () => ({
      data: {
        rows: [
          {
            uid: 'tpl-bad-collection',
            name: 'Roles via association',
            dataSourceKey: 'main',
            collectionName: 'bad',
            associationName: 'users.roles',
            targetUid: 't1',
          },
          { uid: 'tpl-users', name: 'Users', dataSourceKey: 'main', collectionName: 'users', targetUid: 't2' },
        ],
      },
    }));

    const ctx: any = {
      api: { resource: () => ({ list }) },
      t: (k: string) => k,
      dataSourceManager: dsManager,
    };

    const { options } = await (importer as any).fetchTemplateOptions(ctx, '');
    expect(options[0].value).toBe('tpl-bad-collection');
    expect(options[0].disabled).toBe(false);
    expect(options[1].value).toBe('tpl-users');
    expect(options[1].disabled).toBe(true);
  });

  it('skips confirm when current grid has no FormItem fields', async () => {
    const engine = new FlowEngine();

    class FormBlockModel extends FlowModel {}
    class GridModel extends FlowModel {}
    class FormItemModel extends FlowModel {}
    class FormCustomItemModel extends FlowModel {}
    class FormJSFieldItemModel extends FlowModel {}
    class DummyItemModel extends FlowModel {}

    engine.registerModels({
      FormBlockModel,
      GridModel,
      FormItemModel,
      FormCustomItemModel,
      FormJSFieldItemModel,
      DummyItemModel,
      SubModelTemplateImporterModel,
    });

    const form = engine.createModel<FormBlockModel>({ uid: 'host-form', use: 'FormBlockModel' });
    const grid = engine.createModel<GridModel>({
      uid: 'host-grid',
      use: 'GridModel',
      parentId: form.uid,
      subKey: 'grid',
      subType: 'object',
    });
    form.setSubModel('grid', grid);

    // A non-field item exists in grid.items (should NOT trigger the "remove existing fields" confirm)
    const dummy = engine.createModel<DummyItemModel>({
      uid: 'dummy-item',
      use: 'DummyItemModel',
      parentId: grid.uid,
      subKey: 'items',
      subType: 'array',
    });
    grid.addSubModel('items', dummy);

    const importer = engine.createModel<SubModelTemplateImporterModel>({
      uid: 'importer-1',
      use: 'SubModelTemplateImporterModel',
      parentId: grid.uid,
      subKey: 'items',
      subType: 'array',
    });
    grid.addSubModel('items', importer);

    const flow: any = importer.getFlow('subModelTemplateImportSettings');
    const step: any = flow?.getStep?.('selectTemplate')?.serialize?.();
    expect(typeof step?.beforeParamsSave).toBe('function');

    const viewer = { dialog: vi.fn() };
    const view = { close: vi.fn() };
    const ctx: any = {
      model: importer,
      api: {
        resource: () => ({
          get: async () => ({ data: { data: { uid: 'tpl-1', name: 'Template 1', targetUid: 'tpl-root' } } }),
        }),
      },
      viewer,
      view,
      t: (k: string) => k,
      message: { warning: vi.fn(), error: vi.fn() },
    };

    const params: any = { templateUid: 'tpl-1', mode: 'reference' };
    importer.setStepParams('subModelTemplateImportSettings', 'selectTemplate', params);
    await step.beforeParamsSave(ctx, params);

    expect(viewer.dialog).not.toHaveBeenCalled();
    expect(view.close).not.toHaveBeenCalled();
  });

  it('prompts confirm when details grid has existing items', async () => {
    const engine = new FlowEngine();

    class DetailsBlockModel extends FlowModel {}
    class DetailsGridModel extends FlowModel {}
    class DummyItemModel extends FlowModel {}
    class FormItemModel extends FlowModel {}
    class FormCustomItemModel extends FlowModel {}
    class FormJSFieldItemModel extends FlowModel {}

    engine.registerModels({
      DetailsBlockModel,
      DetailsGridModel,
      DummyItemModel,
      FormItemModel,
      FormCustomItemModel,
      FormJSFieldItemModel,
      SubModelTemplateImporterModel,
    });

    const block = engine.createModel<DetailsBlockModel>({ uid: 'host-details', use: 'DetailsBlockModel' });
    const grid = engine.createModel<DetailsGridModel>({
      uid: 'host-grid',
      use: 'DetailsGridModel',
      parentId: block.uid,
      subKey: 'grid',
      subType: 'object',
    });
    block.setSubModel('grid', grid);

    const dummy = engine.createModel<DummyItemModel>({
      uid: 'dummy-item',
      use: 'DummyItemModel',
      parentId: grid.uid,
      subKey: 'items',
      subType: 'array',
    });
    grid.addSubModel('items', dummy);

    const importer = engine.createModel<SubModelTemplateImporterModel>({
      uid: 'importer-1',
      use: 'SubModelTemplateImporterModel',
      parentId: grid.uid,
      subKey: 'items',
      subType: 'array',
    });
    grid.addSubModel('items', importer);

    const flow: any = importer.getFlow('subModelTemplateImportSettings');
    const step: any = flow?.getStep?.('selectTemplate')?.serialize?.();
    expect(typeof step?.beforeParamsSave).toBe('function');

    const viewer = {
      dialog: vi.fn((opts: any) => {
        // 默认模拟用户关闭弹窗 => 视为取消
        opts?.onClose?.();
      }),
    };
    const view = { close: vi.fn() };
    const ctx: any = {
      model: importer,
      api: {
        resource: () => ({
          get: async () => ({ data: { data: { uid: 'tpl-1', name: 'Template 1', targetUid: 'tpl-root' } } }),
        }),
      },
      viewer,
      view,
      t: (k: string) => k,
      message: { warning: vi.fn(), error: vi.fn() },
    };

    const params: any = { templateUid: 'tpl-1', mode: 'reference' };
    importer.setStepParams('subModelTemplateImportSettings', 'selectTemplate', params);
    await expect(step.beforeParamsSave(ctx, params)).rejects.toBeTruthy();

    expect(view.close).toHaveBeenCalled();
    expect(viewer.dialog).toHaveBeenCalled();
  });

  it('waits parent grid saveStepParams before replaceModel save', async () => {
    const engine = new FlowEngine();

    class PageModel extends FlowModel {}
    class FormBlockModel extends FlowModel {}
    class GridModel extends FlowModel {}
    class ReferenceFormGridModel extends FlowModel {}

    const saveCalls: Array<{ uid: string; use: string; onlyStepParams?: boolean }> = [];
    let resolveStepParamsSave: (() => void) | undefined;
    const stepParamsSavePromise = new Promise<{ uid: string }>((resolve) => {
      resolveStepParamsSave = () => resolve({ uid: 'host-grid' });
    });

    engine.setModelRepository({
      findOne: vi.fn(async () => null),
      save: vi.fn(async (model: any, options?: { onlyStepParams?: boolean }) => {
        saveCalls.push({
          uid: String(model?.uid || ''),
          use: String(model?.use || ''),
          onlyStepParams: options?.onlyStepParams,
        });
        if (options?.onlyStepParams) {
          return await stepParamsSavePromise;
        }
        return { uid: model?.uid };
      }),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async () => null),
    });

    engine.registerModels({
      PageModel,
      FormBlockModel,
      GridModel,
      ReferenceFormGridModel,
      SubModelTemplateImporterModel,
    });

    const page = engine.createModel<PageModel>({ uid: 'page', use: 'PageModel' });
    const form = engine.createModel<FormBlockModel>({
      uid: 'host-form',
      use: 'FormBlockModel',
      parentId: page.uid,
      subKey: 'items',
      subType: 'array',
    });
    page.addSubModel('items', form);

    const grid = engine.createModel<GridModel>({
      uid: 'host-grid',
      use: 'GridModel',
      parentId: form.uid,
      subKey: 'grid',
      subType: 'object',
    });
    form.setSubModel('grid', grid);

    grid.emitter.on('onSubModelRemoved', () => {
      void grid.saveStepParams();
    });

    const importer = engine.createModel<SubModelTemplateImporterModel>({
      uid: 'importer-1',
      use: 'SubModelTemplateImporterModel',
      parentId: grid.uid,
      subKey: 'items',
      subType: 'array',
      stepParams: {
        subModelTemplateImportSettings: {
          selectTemplate: {
            templateUid: 'tpl-1',
            targetUid: 'tpl-root',
            templateName: 'Template 1',
            mode: 'reference',
          },
        },
      },
    });
    grid.addSubModel('items', importer);

    const run = importer.afterAddAsSubModel();

    await Promise.resolve();
    expect(saveCalls).toHaveLength(1);
    expect(saveCalls[0]).toMatchObject({ uid: 'host-grid', use: 'GridModel', onlyStepParams: true });

    resolveStepParamsSave?.();
    await run;

    expect(saveCalls).toHaveLength(2);
    expect(saveCalls[1]).toMatchObject({ uid: 'host-grid', use: 'ReferenceFormGridModel' });
    expect((form.subModels as any)?.grid?.use).toBe('ReferenceFormGridModel');
  });
});
