/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReferenceBlockModel } from '../ReferenceBlockModel';

class MockGridModel extends FlowModel {}

class MockFormBlockModel extends FlowModel {
  constructor(options: any) {
    super(options);
    const titleFromProps = options?.props?.title || options?.title;
    if (titleFromProps) {
      this.setTitle(titleFromProps);
    }
  }

  onInit(options: any) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      value: { name: 'mock-collection' },
    });
  }
}

class PassiveBlockModel extends FlowModel {}

class ThrowingCollectionBlockModel extends FlowModel {
  onInit(options: any) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      cache: false,
      get: () => {
        throw new Error('target collection getter failed');
      },
    });
  }
}

class MockInteractiveBlockModel extends FlowModel {
  onInit(options: any) {
    super.onInit(options);
    this.context.defineProperty('collection', {
      value: { filterTargetKey: 'id' },
    });
  }

  get collection() {
    return this.context.collection;
  }

  highlightRow(record: any) {
    this.setProps('highlightedRowKey', record?.[this.collection?.filterTargetKey]);
  }

  clearHighlight() {
    this.setProps('highlightedRowKey', undefined);
  }
}

MockInteractiveBlockModel.registerEvents({
  rowClick: {
    title: 'Row click',
    name: 'rowClick',
    handler: vi.fn(async (ctx) => {
      const model = ctx.model as MockInteractiveBlockModel;
      const rowKey = ctx.inputArgs.record?.[model.collection?.filterTargetKey];
      if (model.props.highlightedRowKey !== rowKey) {
        model.highlightRow(ctx.inputArgs.record);
      } else {
        model.clearHighlight();
      }
    }),
  },
});

class DetailsBlockModel extends FlowModel {}
class EditFormModel extends FlowModel {}

const TEST_TIMEOUT = 10_000;

const expectTargetModel = (model: ReferenceBlockModel): FlowModel => {
  const target = (model as any)._targetModel as FlowModel | undefined;
  expect(target).toBeTruthy();
  if (!target) {
    throw new Error('Expected reference block target model to be initialized');
  }
  return target;
};

describe('ReferenceBlockModel', () => {
  let engine: FlowEngine;
  let gridModel: FlowModel;
  let targetBlockModel: FlowModel;
  let referenceBlockModel: ReferenceBlockModel;
  let scopedEngine: FlowEngine;
  let store: Record<string, any>;
  let lastSavedSnapshot: Record<string, any>;
  let hostCollection: { name: string };

  beforeEach(() => {
    vi.spyOn(ReferenceBlockModel.prototype as any, 'rerender').mockResolvedValue(undefined);
    engine = new FlowEngine();
    scopedEngine = new FlowEngine();
    lastSavedSnapshot = {};
    hostCollection = { name: 'host-collection' };
    store = {
      'grid-uid': {
        uid: 'grid-uid',
        use: 'GridModel',
        parentId: 'page-uid',
        subKey: 'items',
        subType: 'array',
      },
      'target-block-uid': {
        uid: 'target-block-uid',
        use: 'FormBlockModel',
        parentId: 'grid-uid',
        subKey: 'items',
        subType: 'array',
        props: { title: 'Test Form Block' },
      },
      'interactive-target-uid': {
        uid: 'interactive-target-uid',
        use: 'InteractiveBlockModel',
        parentId: 'grid-uid',
        subKey: 'items',
        subType: 'array',
      },
    };

    // Mock api to avoid context errors
    engine.context.defineProperty('api', {
      value: {
        auth: {
          role: 'admin',
          locale: 'zh-CN',
          token: 'test-token',
        },
      },
    });
    scopedEngine.context.defineProperty('api', { value: engine.context.api });

    const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
    const mockRepository = {
      findOne: vi.fn(async (query) => {
        const data = store[query.uid];
        return data ? clone(data) : null;
      }),
      save: vi.fn(async (model) => {
        const data = typeof model.serialize === 'function' ? model.serialize() : model;
        lastSavedSnapshot[data.uid] = clone(data);
        store[data.uid] = { ...(store[data.uid] || {}), ...clone(data) };
        const sub = data.subModels || {};
        if (sub && typeof sub === 'object') {
          Object.values(sub).forEach((child: any) => {
            if (!child) return;
            if (Array.isArray(child)) {
              child.forEach((c) => {
                if (c?.uid) {
                  store[c.uid] = { ...(store[c.uid] || {}), ...clone(c) };
                  lastSavedSnapshot[c.uid] = clone(c);
                }
              });
            } else if (child.uid) {
              store[child.uid] = { ...(store[child.uid] || {}), ...clone(child) };
              lastSavedSnapshot[child.uid] = clone(child);
            }
          });
        }
        return { uid: data.uid };
      }),
      destroy: vi.fn(async (uid) => {
        const key = typeof uid === 'string' ? uid : uid?.uid;
        if (key && store[key]) {
          delete store[key];
        }
        return true;
      }),
      move: vi.fn(async () => {}),
      duplicate: vi.fn(async (uid) => {
        const data = store[uid];
        if (!data) return null;
        const copy = { ...clone(data), uid: `${uid}-copy` };
        store[copy.uid] = copy;
        return { uid: copy.uid };
      }),
    };

    engine.setModelRepository(mockRepository);
    scopedEngine.setModelRepository(mockRepository);

    // 注册 ReferenceBlockModel
    engine.registerModels({
      GridModel: MockGridModel,
      FormBlockModel: MockFormBlockModel,
      PassiveBlockModel,
      ThrowingCollectionBlockModel,
      InteractiveBlockModel: MockInteractiveBlockModel,
      DetailsBlockModel,
      EditFormModel,
      ReferenceBlockModel,
    });
    scopedEngine.registerModels({
      GridModel: MockGridModel,
      FormBlockModel: MockFormBlockModel,
      PassiveBlockModel,
      ThrowingCollectionBlockModel,
      InteractiveBlockModel: MockInteractiveBlockModel,
      DetailsBlockModel,
      EditFormModel,
      ReferenceBlockModel,
    });

    // 创建 Grid 模型
    gridModel = engine.createModel({
      uid: 'grid-uid',
      use: 'GridModel',
      parentId: 'page-uid',
      subKey: 'items',
      subType: 'array',
    });
    gridModel.context.defineProperty('collection', {
      value: hostCollection,
    });

    // 创建目标区块模型（表单区块）
    targetBlockModel = engine.createModel({
      uid: 'target-block-uid',
      use: 'FormBlockModel',
      parentId: 'grid-uid',
      subKey: 'items',
      subType: 'array',
    });

    // 添加目标区块到 Grid
    gridModel.addSubModel('items', targetBlockModel);

    vi.spyOn(ReferenceBlockModel.prototype as any, '_ensureScopedEngine').mockReturnValue(scopedEngine);
    vi.spyOn(ReferenceBlockModel.prototype as any, '_resolveFinalTarget').mockImplementation(async (uid: string) => {
      if (!uid) return null;
      return scopedEngine.loadModel({ uid });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Original block should remain', () => {
    it(
      'should not change target parentId when creating a reference block',
      async () => {
        // 记录目标区块的初始 parentId
        const originalParentId = (targetBlockModel as any)._options.parentId;
        expect(originalParentId).toBe('grid-uid');

        // 创建引用区块
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        // 添加引用区块到 Grid
        gridModel.addSubModel('items', referenceBlockModel);

        // 触发 beforeRender 事件，加载目标区块
        await referenceBlockModel.dispatchEvent('beforeRender');

        // 验证目标区块的 parentId 没有被修改
        const currentParentId = (targetBlockModel as any)._options.parentId;
        expect(currentParentId).toBe('grid-uid');
        expect(currentParentId).toBe(originalParentId);
        expect(store['target-block-uid'].parentId).toBe('grid-uid');

        // 验证目标区块不是引用区块的 parent（只是内存中的引用关系）
        expect((targetBlockModel as any)._options.parentId).not.toBe('reference-block-uid');
      },
      TEST_TIMEOUT,
    );

    it(
      'should not persist target block when saving the reference block',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.onDispatchEventStart('beforeRender');
        await referenceBlockModel.save();

        const savedRef = store['reference-block-uid'];
        expect(savedRef.subModels?.target).toBeUndefined();
        expect(savedRef.parentId).toBe('grid-uid');
        expect(store['target-block-uid'].parentId).toBe('grid-uid');
        expect(lastSavedSnapshot['reference-block-uid']?.subModels?.target).toBeUndefined();
        expect(lastSavedSnapshot['target-block-uid']).toBeUndefined();
      },
      TEST_TIMEOUT,
    );

    it(
      'should hydrate reference target before saving template references in preset settings flow',
      async () => {
        const templateGet = vi.fn(async () => ({
          name: 'Template One',
          description: 'Template description',
          targetUid: 'target-block-uid',
          dataSourceKey: 'main',
          collectionName: 'users',
          associationName: 'users.roles',
        }));
        (engine.context.api as any).resource = vi.fn((name: string) => {
          if (name !== 'flowModelTemplates') {
            throw new Error(`Unexpected resource ${name}`);
          }
          return { get: templateGet };
        });

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-save-hook',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              useTemplate: {
                templateUid: 'tpl-1',
                mode: 'reference',
              },
              target: {
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        const useTemplateStep = (ReferenceBlockModel as any).globalFlowRegistry.getFlow('referenceSettings')?.steps
          ?.useTemplate;
        await useTemplateStep?.beforeParamsSave?.(
          {
            api: engine.context.api,
            engine,
            model: referenceBlockModel,
          },
          {
            templateUid: 'tpl-1',
            mode: 'reference',
          },
        );
        await referenceBlockModel.saveStepParams();

        expect(templateGet).toHaveBeenCalledWith({ filterByTk: 'tpl-1' });
        expect(referenceBlockModel.getStepParams('referenceSettings', 'useTemplate')).toMatchObject({
          templateUid: 'tpl-1',
          templateName: 'Template One',
          templateDescription: 'Template description',
          targetUid: 'target-block-uid',
          mode: 'reference',
        });
        expect(referenceBlockModel.getStepParams('referenceSettings', 'target')).toMatchObject({
          targetUid: 'target-block-uid',
          mode: 'reference',
        });
        expect(referenceBlockModel.getStepParams('resourceSettings', 'init')).toMatchObject({
          dataSourceKey: 'main',
          collectionName: 'users',
          associationName: 'users.roles',
        });
        expect(lastSavedSnapshot['reference-block-save-hook']?.stepParams?.referenceSettings?.target).toMatchObject({
          targetUid: 'target-block-uid',
          mode: 'reference',
        });
      },
      TEST_TIMEOUT,
    );

    it(
      'should expose target collection on reference block context',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        expect(referenceBlockModel.context.collection.name).toBe('mock-collection');
      },
      TEST_TIMEOUT,
    );

    it(
      'should fallback to host collection when target does not define collection context',
      async () => {
        store['target-without-collection-context'] = {
          uid: 'target-without-collection-context',
          use: 'PassiveBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
        };

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid-no-own-context',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-without-collection-context',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        const target = (referenceBlockModel as any)._targetModel as FlowModel;
        expect(target).toBeTruthy();
        expect(() => target.context.collection).not.toThrow();
        expect(target.context.collection).toBe(hostCollection);
        expect(referenceBlockModel.context.collection).toBe(hostCollection);
      },
      TEST_TIMEOUT,
    );

    it(
      'should fallback to host collection when target own collection getter throws',
      async () => {
        store['target-with-throwing-collection-context'] = {
          uid: 'target-with-throwing-collection-context',
          use: 'ThrowingCollectionBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
        };

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid-throwing-context',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-with-throwing-collection-context',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        expect(() => referenceBlockModel.context.collection).not.toThrow();
        expect(referenceBlockModel.context.collection).toBe(hostCollection);
      },
      TEST_TIMEOUT,
    );

    it(
      'should find target block by grid parentId after a reload',
      async () => {
        // 模拟刷新页面的场景：重新从 repository 加载
        const reloadedTargetBlock = await engine.loadModel({ uid: 'target-block-uid' });

        // 验证加载的目标区块的 parentId 仍然指向 Grid
        expect((reloadedTargetBlock as any).parentId).toBe('grid-uid');

        // 验证 Grid 可以通过 findModelByParentId 找到目标区块
        const mockRepo = engine.modelRepository as any;
        const foundBlock = await mockRepo.findOne({ uid: 'target-block-uid' });
        expect(foundBlock.parentId).toBe('grid-uid');
        expect(foundBlock.parentId).not.toBe('reference-block-uid');
      },
      TEST_TIMEOUT,
    );
  });

  describe('Template option disabled rules', () => {
    it('disables template when associationName mismatches in association context', async () => {
      referenceBlockModel = engine.createModel({
        uid: 'reference-block-uid',
        use: 'ReferenceBlockModel',
        parentId: 'grid-uid',
        subKey: 'items',
        subType: 'array',
        stepParams: {
          resourceSettings: {
            init: {
              associationName: 'users.profile',
            },
          },
        },
      }) as ReferenceBlockModel;

      const list = vi.fn(async () => ({
        data: {
          rows: [
            { uid: 'tpl-ok', name: 'OK', associationName: 'users.profile' },
            { uid: 'tpl-mismatch', name: 'Mismatch', associationName: 'users.posts' },
          ],
        },
      }));

      const ctx: any = {
        model: referenceBlockModel,
        api: {
          resource: (name: string) => {
            if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
            return { list };
          },
        },
        t: (k: string) => k,
      };

      const flow: any = referenceBlockModel.getFlow('referenceSettings');
      const step: any = flow?.getStep?.('useTemplate');
      expect(typeof step?.uiSchema).toBe('function');
      const schema: any = step.uiSchema(ctx);
      const reactions = schema?.templateUid?.['x-reactions'] || [];
      expect(Array.isArray(reactions)).toBe(true);
      expect(typeof reactions[0]).toBe('function');

      const field: any = { componentProps: {}, data: {} };
      reactions[0](field);
      await field.componentProps.onDropdownVisibleChange(true);

      const opts = field.dataSource;
      expect(Array.isArray(opts)).toBe(true);
      expect(opts[0].value).toBe('tpl-ok');
      expect(opts[0].disabled).toBe(false);
      expect(opts[1].value).toBe('tpl-mismatch');
      expect(opts[1].disabled).toBe(true);
      expect(String(opts[1].disabledReason || '')).toContain('Template association mismatch');
    });

    it('disables association templates when current context is not an association resource', async () => {
      referenceBlockModel = engine.createModel({
        uid: 'reference-block-uid',
        use: 'ReferenceBlockModel',
        parentId: 'grid-uid',
        subKey: 'items',
        subType: 'array',
        stepParams: {
          resourceSettings: {
            init: {
              associationName: 'users',
            },
          },
        },
      }) as ReferenceBlockModel;

      const list = vi.fn(async () => ({
        data: {
          rows: [{ uid: 'tpl-assoc', name: 'Assoc', associationName: 'users.profile' }],
        },
      }));

      const ctx: any = {
        model: referenceBlockModel,
        api: {
          resource: (name: string) => {
            if (name !== 'flowModelTemplates') throw new Error('unexpected resource');
            return { list };
          },
        },
        t: (k: string) => k,
      };

      const flow: any = referenceBlockModel.getFlow('referenceSettings');
      const step: any = flow?.getStep?.('useTemplate');
      const schema: any = step.uiSchema(ctx);
      const reactions = schema?.templateUid?.['x-reactions'] || [];
      const field: any = { componentProps: {}, data: {} };
      reactions[0](field);
      await field.componentProps.onDropdownVisibleChange(true);

      const opts = field.dataSource;
      expect(opts[0].value).toBe('tpl-assoc');
      expect(opts[0].disabled).toBe(true);
      expect(String(opts[0].disabledReason || '')).toContain('Template association mismatch');
    });
  });

  describe('Template fallback (filterByTk mismatch → list)', () => {
    it(
      'reference + template + collection mismatch: patches target getStepParams(resourceSettings.init) to omit filterByTk',
      async () => {
        store['details-block-uid'] = {
          uid: 'details-block-uid',
          use: 'DetailsBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            resourceSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'A',
                filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
              },
            },
          },
        };

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              useTemplate: {
                templateUid: 'tpl-1',
                mode: 'reference',
              },
              target: {
                targetUid: 'details-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;
        gridModel.addSubModel('items', referenceBlockModel);

        referenceBlockModel.context.defineProperty('view', {
          value: { inputArgs: { dataSourceKey: 'main', collectionName: 'B', filterByTk: 1 } },
        });

        await referenceBlockModel.onDispatchEventStart('beforeRender');

        const targetModel = (referenceBlockModel as any)._targetModel as FlowModel;
        expect(targetModel).toBeDefined();
        const init = targetModel.getStepParams('resourceSettings', 'init') as any;
        expect(Object.prototype.hasOwnProperty.call(init, 'filterByTk')).toBe(false);
        // StepParams 本身不应被修改
        expect((targetModel as any)?.stepParams?.resourceSettings?.init).toHaveProperty('filterByTk');
      },
      TEST_TIMEOUT,
    );

    it(
      'reference + non-template: does not patch init (filterByTk stays)',
      async () => {
        store['details-block-uid'] = {
          uid: 'details-block-uid',
          use: 'DetailsBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            resourceSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'A',
                filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
              },
            },
          },
        };

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'details-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;
        gridModel.addSubModel('items', referenceBlockModel);

        referenceBlockModel.context.defineProperty('view', {
          value: { inputArgs: { dataSourceKey: 'main', collectionName: 'B', filterByTk: 1 } },
        });

        await referenceBlockModel.onDispatchEventStart('beforeRender');

        const targetModel = (referenceBlockModel as any)._targetModel as FlowModel;
        const init = targetModel.getStepParams('resourceSettings', 'init') as any;
        expect(Object.prototype.hasOwnProperty.call(init, 'filterByTk')).toBe(true);
      },
      TEST_TIMEOUT,
    );

    it(
      'copy + template + mismatch: deletes duplicated.stepParams.resourceSettings.init.filterByTk before createModel',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
        }) as ReferenceBlockModel;
        gridModel.addSubModel('items', referenceBlockModel);

        referenceBlockModel.context.defineProperty('view', {
          value: { inputArgs: { dataSourceKey: 'main', collectionName: 'B', filterByTk: 1 } },
        });

        const duplicated = {
          uid: 'details-copy-uid',
          use: 'DetailsBlockModel',
          stepParams: {
            resourceSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'A',
                filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
              },
            },
          },
        } as any;

        vi.spyOn(engine, 'duplicateModel').mockResolvedValue(duplicated);
        vi.spyOn(engine, 'createModel').mockImplementation(((options: any) => {
          const init = options?.stepParams?.resourceSettings?.init;
          expect(init).toBeDefined();
          expect(Object.prototype.hasOwnProperty.call(init, 'filterByTk')).toBe(false);
          throw new Error('STOP');
        }) as any);

        const flow: any = (ReferenceBlockModel as any).globalFlowRegistry.getFlow('referenceSettings');
        const step: any = flow?.steps?.target;
        expect(typeof step?.beforeParamsSave).toBe('function');

        await expect(
          step.beforeParamsSave({ engine, model: referenceBlockModel, exit: vi.fn() } as any, {
            targetUid: 'details-origin-uid',
            mode: 'copy',
            templateUid: 'tpl-1',
          }),
        ).rejects.toThrow('STOP');
      },
      TEST_TIMEOUT,
    );

    it(
      'copy mutate should include parent use in saveParent upsert payload',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-mutate-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
        }) as ReferenceBlockModel;
        gridModel.addSubModel('items', referenceBlockModel);

        const repo = engine.modelRepository as any;
        repo.mutate = vi.fn(async (payload: any) => {
          const saveParentOp = payload?.ops?.find((op: any) => op?.opId === 'saveParent');
          expect(saveParentOp?.params?.values).toMatchObject({
            uid: 'grid-uid',
            use: 'GridModel',
          });
          throw new Error('STOP');
        });

        const flow: any = (ReferenceBlockModel as any).globalFlowRegistry.getFlow('referenceSettings');
        const step: any = flow?.steps?.target;
        expect(typeof step?.beforeParamsSave).toBe('function');

        await expect(
          step.beforeParamsSave({ engine, model: referenceBlockModel, exit: vi.fn() } as any, {
            targetUid: 'details-origin-uid',
            mode: 'copy',
          }),
        ).rejects.toThrow('STOP');
        expect(repo.mutate).toHaveBeenCalledTimes(1);
      },
      TEST_TIMEOUT,
    );

    it(
      'copy mutate should preserve rowOrder, persist template fallback patch, and emit onSubModelDestroyed',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-mutate-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
        }) as ReferenceBlockModel;
        gridModel.addSubModel('items', referenceBlockModel);

        const rows = {
          'row-1': [['target-block-uid', 'reference-block-mutate-uid']],
        };
        const sizes = { 'row-1': [24] };
        const rowOrder = ['row-1'];
        gridModel.setStepParams('gridSettings', 'grid', { rows, sizes, rowOrder });
        gridModel.setProps({ rows, sizes, rowOrder });

        referenceBlockModel.context.defineProperty('view', {
          value: { inputArgs: { dataSourceKey: 'main', collectionName: 'B', filterByTk: 1 } },
        });

        const destroyedSpy = vi.fn();
        gridModel.emitter.on('onSubModelDestroyed', destroyedSpy);

        const repo = engine.modelRepository as any;
        let duplicatedUid = '';
        repo.mutate = vi.fn(async (payload: any) => {
          duplicatedUid = String(payload?.ops?.[0]?.params?.targetUid || '').trim();
          const saveParentOp = payload?.ops?.find((op: any) => op?.opId === 'saveParent');
          expect(saveParentOp?.params?.values?.stepParams?.gridSettings?.grid).toMatchObject({
            rows: {
              'row-1': [['target-block-uid', duplicatedUid]],
            },
            sizes,
            rowOrder,
          });
          return {
            models: {
              [duplicatedUid]: {
                uid: duplicatedUid,
                use: 'DetailsBlockModel',
                stepParams: {
                  resourceSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'A',
                      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
                    },
                  },
                },
              },
            },
          };
        });

        const flow: any = (ReferenceBlockModel as any).globalFlowRegistry.getFlow('referenceSettings');
        const step: any = flow?.steps?.target;

        await step.beforeParamsSave({ engine, model: referenceBlockModel, exit: vi.fn() } as any, {
          targetUid: 'details-origin-uid',
          mode: 'copy',
          templateUid: 'tpl-1',
        });

        const items = (((gridModel.subModels as any).items || []) as FlowModel[]).map((model) => model.uid);
        expect(items).toContain('target-block-uid');
        expect(items).toContain(duplicatedUid);
        expect(items).not.toContain('reference-block-mutate-uid');
        expect(engine.getModel('reference-block-mutate-uid')).toBeUndefined();
        expect(destroyedSpy).toHaveBeenCalledTimes(1);
        expect(destroyedSpy).toHaveBeenCalledWith(referenceBlockModel);

        const duplicatedModel = engine.getModel<FlowModel>(duplicatedUid);
        const init = duplicatedModel?.getStepParams('resourceSettings', 'init') as any;
        expect(init).toBeDefined();
        expect(Object.prototype.hasOwnProperty.call(init, 'filterByTk')).toBe(false);

        const saveStepParamsCall = repo.save.mock.calls.find(
          ([model, options]: [FlowModel, { onlyStepParams?: boolean } | undefined]) =>
            model?.uid === duplicatedUid && options?.onlyStepParams,
        );
        expect(saveStepParamsCall).toBeTruthy();
        expect(lastSavedSnapshot[duplicatedUid]?.stepParams?.resourceSettings?.init).toBeDefined();
        expect(
          Object.prototype.hasOwnProperty.call(
            lastSavedSnapshot[duplicatedUid]?.stepParams?.resourceSettings?.init || {},
            'filterByTk',
          ),
        ).toBe(false);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Reference block basics', () => {
    it(
      'should keep target runtime context engine scoped after parent delegation',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        const targetModel = (referenceBlockModel as any)._targetModel as FlowModel;
        expect(targetModel).toBeDefined();
        expect(targetModel.context.engine).toBe(scopedEngine);
      },
      TEST_TIMEOUT,
    );

    it(
      'should resolve the target block correctly',
      async () => {
        gridModel.addSubModel('items', targetBlockModel);

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.onDispatchEventStart('beforeRender');

        // 验证 _targetModel 被正确设置
        const targetModel = (referenceBlockModel as any)._targetModel;
        expect(targetModel).toBeDefined();
        expect(targetModel?.uid).toBe('target-block-uid');
      },
      TEST_TIMEOUT,
    );

    it(
      'should clear target model when target UID is empty',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: '',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        await referenceBlockModel.onDispatchEventStart('beforeRender');

        // 验证 _targetModel 为 undefined
        const targetModel = (referenceBlockModel as any)._targetModel;
        expect(targetModel).toBeUndefined();
      },
      TEST_TIMEOUT,
    );

    it(
      'should render reference block title from target',
      async () => {
        // 创建目标区块，包含标题
        const targetWithTitle = engine.createModel({
          uid: 'target-block-with-title',
          use: 'FormBlockModel',
          parentId: 'grid-uid',
          props: {
            title: 'Test Form Block',
          },
        });

        gridModel.addSubModel('items', targetWithTitle);

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-with-title',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        // Mock repository 返回目标区块
        const mockRepo = engine.modelRepository as any;
        mockRepo.findOne = vi.fn(async (query) => {
          if (query.uid === 'target-block-with-title') {
            return {
              uid: 'target-block-with-title',
              use: 'FormBlockModel',
              parentId: 'grid-uid',
              props: {
                title: 'Test Form Block',
              },
            };
          }
          return null;
        });

        await referenceBlockModel.onDispatchEventStart('beforeRender');

        // title 展示目标标题；模板信息放在 extraTitle
        const title = referenceBlockModel.title;
        expect(title).toContain('Test Form Block');
        expect((referenceBlockModel as any).extraTitle).toMatch(/Reference template|引用模板/);
      },
      TEST_TIMEOUT,
    );
  });

  describe('Props forwarding', () => {
    it(
      'reapplies relation appends after template fallback recreates target resource',
      async () => {
        class SwitchableDetailsBlockModel extends FlowModel {
          onInit(options: any) {
            super.onInit(options);
            this.context.defineProperty('association', {
              get: () => this.getStepParams('mockSettings', 'association'),
              cache: false,
            });
            this.context.defineProperty('blockModel', {
              value: this,
            });
            this.context.defineProperty('resource', {
              get: () => {
                const init = this.getStepParams('resourceSettings', 'init') || {};
                const associationType = this.context.association?.type;
                const useSingle =
                  associationType === 'hasOne' ||
                  associationType === 'belongsTo' ||
                  Object.keys(init).includes('filterByTk');
                const resource = this.context.createResource(
                  useSingle ? (SingleRecordResource as any) : (MultiRecordResource as any),
                ) as any;
                resource.setDataSourceKey(init.dataSourceKey);
                resource.setResourceName(init.associationName || init.collectionName);
                if (Object.keys(init).includes('sourceId')) {
                  resource.setSourceId(init.sourceId);
                }
                if (Object.keys(init).includes('filterByTk')) {
                  resource.setFilterByTk(init.filterByTk);
                }
                if (resource instanceof MultiRecordResource) {
                  resource.setPageSize(1);
                }
                return resource;
              },
            });
          }

          addAppends(fieldPath?: string) {
            if (!fieldPath) {
              return;
            }
            this.context.resource.addAppends(fieldPath);
          }
        }

        class MockRelationFieldModel extends FlowModel {
          onInit(options: any) {
            super.onInit(options);
            const init = this.getStepParams('fieldSettings', 'init') || {};
            this.context.blockModel?.addAppends?.(init.fieldPath);
            this.context.blockModel?.addAppends?.(init.associationPathName);
          }
        }

        engine.registerModels({
          DetailsBlockModel: SwitchableDetailsBlockModel,
          RelationFieldModel: MockRelationFieldModel,
        });
        scopedEngine.registerModels({
          DetailsBlockModel: SwitchableDetailsBlockModel,
          RelationFieldModel: MockRelationFieldModel,
        });
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          stepParams: {
            referenceSettings: {
              useTemplate: {
                templateUid: 'tpl-1',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;
        referenceBlockModel.context.defineProperty('view', {
          value: {
            inputArgs: {
              dataSourceKey: 'main',
              collectionName: 'B',
              filterByTk: 1,
            },
          },
        });

        const target = scopedEngine.createModel<FlowModel>({
          uid: 'target-with-relation-uid',
          use: 'DetailsBlockModel',
          stepParams: {
            resourceSettings: {
              init: {
                dataSourceKey: 'main',
                collectionName: 'A',
                filterByTk: 1,
              },
            },
          },
          subModels: {
            grid: {
              uid: 'target-with-relation-grid',
              use: 'GridModel',
              subKey: 'grid',
              subType: 'object',
              subModels: {
                items: [
                  {
                    uid: 'target-with-relation-field',
                    use: 'RelationFieldModel',
                    subKey: 'items',
                    subType: 'array',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          fieldPath: 'profile.nickname',
                          associationPathName: 'profile',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        });

        expect(target.context.resource).toBeInstanceOf(SingleRecordResource);
        expect(target.context.resource.getAppends()).toEqual(expect.arrayContaining(['profile', 'profile.nickname']));

        (referenceBlockModel as any)._applyTemplateFallbackPatchState(target);

        expect(target.context.resource).toBeInstanceOf(MultiRecordResource);
        expect(target.context.resource.getAppends()).toEqual(expect.arrayContaining(['profile', 'profile.nickname']));
      },
      TEST_TIMEOUT,
    );

    it(
      'should forward props mutations to target model after beforeRender',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        const target = expectTargetModel(referenceBlockModel);
        expect(referenceBlockModel.props).toBe(target.props);

        (referenceBlockModel.props as any).summary = 'x';
        expect((target.props as any).summary).toBe('x');
      },
      TEST_TIMEOUT,
    );

    it(
      'should forward setProps/getProps to target model',
      async () => {
        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'target-block-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        const target = expectTargetModel(referenceBlockModel);

        referenceBlockModel.setProps({ summary: 'y' as any });
        expect((target.props as any).summary).toBe('y');
        expect((referenceBlockModel.getProps() as any).summary).toBe('y');
      },
      TEST_TIMEOUT,
    );
  });

  describe('Event forwarding', () => {
    it(
      'should expose target events on reference block',
      async () => {
        const interactiveTarget = engine.createModel({
          uid: 'interactive-target-uid',
          use: 'InteractiveBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
        });

        gridModel.addSubModel('items', interactiveTarget);

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'interactive-target-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        expect(referenceBlockModel.getEvents().has('beforeRender')).toBe(true);
        expect(referenceBlockModel.getEvents().has('rowClick')).toBe(true);
        expect(referenceBlockModel.getEvent('rowClick')?.name).toBe('rowClick');
      },
      TEST_TIMEOUT,
    );

    it(
      'should forward target rowClick dispatch to reference flows',
      async () => {
        const interactiveTarget = engine.createModel({
          uid: 'interactive-target-uid',
          use: 'InteractiveBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
        });

        gridModel.addSubModel('items', interactiveTarget);

        referenceBlockModel = engine.createModel({
          uid: 'reference-block-uid',
          use: 'ReferenceBlockModel',
          parentId: 'grid-uid',
          subKey: 'items',
          subType: 'array',
          stepParams: {
            referenceSettings: {
              target: {
                targetUid: 'interactive-target-uid',
                mode: 'reference',
              },
            },
          },
        }) as ReferenceBlockModel;

        gridModel.addSubModel('items', referenceBlockModel);

        await referenceBlockModel.dispatchEvent('beforeRender');

        const flowSpy = vi.fn(async () => undefined);
        referenceBlockModel.registerFlow({
          key: 'row-click-flow',
          on: {
            eventName: 'rowClick',
          },
          steps: {
            test: {
              handler: flowSpy,
            },
          },
        });

        const target = expectTargetModel(referenceBlockModel);

        await target.dispatchEvent('rowClick', { record: { id: 1 } });

        expect((target.props as any).highlightedRowKey).toBe(1);
        expect(flowSpy).toHaveBeenCalledTimes(1);
      },
      TEST_TIMEOUT,
    );
  });
});
