/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
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

const TEST_TIMEOUT = 10_000;

describe('ReferenceBlockModel', () => {
  let engine: FlowEngine;
  let gridModel: FlowModel;
  let targetBlockModel: FlowModel;
  let referenceBlockModel: ReferenceBlockModel;
  let scopedEngine: FlowEngine;
  let store: Record<string, any>;
  let lastSavedSnapshot: Record<string, any>;

  beforeEach(() => {
    vi.spyOn(ReferenceBlockModel.prototype as any, 'rerender').mockResolvedValue(undefined);
    engine = new FlowEngine();
    scopedEngine = new FlowEngine();
    lastSavedSnapshot = {};
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
      ReferenceBlockModel,
    });
    scopedEngine.registerModels({
      GridModel: MockGridModel,
      FormBlockModel: MockFormBlockModel,
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

  describe('Reference block basics', () => {
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
});
