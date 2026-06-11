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
import type { IFlowModelRepository } from '../types';

class BaseModel extends FlowModel {}
class SubModelA extends BaseModel {}
class SubModelB extends BaseModel {}
class SubModelC extends SubModelA {}

describe('FlowEngine', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({
      BaseModel,
      SubModelA,
      SubModelB,
      SubModelC,
    });
  });

  it('getModelClass should return correct class', () => {
    expect(engine.getModelClass('BaseModel')).toBe(BaseModel);
    expect(engine.getModelClass('SubModelA')).toBe(SubModelA);
    expect(engine.getModelClass('NotExist')).toBeUndefined();
  });

  it('getSubclassesOf should return all subclasses', () => {
    const result = engine.getSubclassesOf(BaseModel);
    expect(result.has('BaseModel')).toBe(false);
    expect(result.has('SubModelA')).toBe(true);
    expect(result.has('SubModelB')).toBe(true);
    expect(result.has('SubModelC')).toBe(true);
  });

  it('getSubclassesOf should support filter', () => {
    const result = engine.getSubclassesOf(BaseModel, (ModelClass, name) => name.startsWith('SubModel'));
    expect(result.has('BaseModel')).toBe(false);
    expect(result.has('SubModelA')).toBe(true);
    expect(result.has('SubModelB')).toBe(true);
    expect(result.has('SubModelC')).toBe(true);
  });

  it('findModelClass should find by predicate', () => {
    const found = engine.findModelClass((name) => name === 'SubModelB');
    expect(found).toBeDefined();
    expect(found?.[0]).toBe('SubModelB');
    expect(found?.[1]).toBe(SubModelB);
  });

  it('filterModelClassByParent should return correct subclasses', () => {
    const result = engine.filterModelClassByParent(SubModelA);
    expect(result.has('SubModelA')).toBe(false);
    expect(result.has('SubModelC')).toBe(true);
    expect(result.has('BaseModel')).toBe(false);
    expect(result.has('SubModelB')).toBe(false);
  });

  it('registerAction/getAction should work', () => {
    engine.registerActions({
      testAction: {
        name: 'testAction',
        handler: vi.fn(),
      },
    });
    const action = engine.getAction('testAction');
    expect(action).toBeDefined();
    expect(action?.name).toBe('testAction');
  });

  it('registerModels should overwrite existing model', () => {
    class NewBaseModel extends FlowModel {}
    engine.registerModels({ BaseModel: NewBaseModel });
    expect(engine.getModelClass('BaseModel')).toBe(NewBaseModel);
  });

  describe('loadOrCreateModel', () => {
    class MockFlowModelRepository implements IFlowModelRepository {
      // 使用可配置返回值，便于不同用例控制 findOne 行为
      findOneResult: any = null;
      save = vi.fn(async (model: FlowModel) => ({ success: true, uid: model.uid }));
      async findOne() {
        // 返回深拷贝，避免被测试过程修改
        return this.findOneResult ? JSON.parse(JSON.stringify(this.findOneResult)) : null;
      }
      async destroy() {
        return true;
      }
      async move() {}
      async duplicate() {
        return null;
      }
    }

    let repo: MockFlowModelRepository;

    beforeEach(() => {
      repo = new MockFlowModelRepository();
      engine.setModelRepository(repo);
    });

    it('should set as object subModel when subType=object even if subKey="array" (regression for subType check)', async () => {
      // 父模型
      const parent = engine.createModel({ uid: 'p1', use: 'FlowModel' });

      // 仓库返回数据：subKey 恰好为 'array'，但 subType 是 'object'
      repo.findOneResult = {
        uid: 'c1',
        use: 'FlowModel',
        parentId: parent.uid,
        subKey: 'array',
        subType: 'object',
      };

      const child = await engine.loadOrCreateModel({
        uid: 'c1',
        use: 'FlowModel',
        parentId: parent.uid,
        subKey: 'array',
        subType: 'object',
      });

      expect(child).toBeTruthy();
      // 关键断言：应按 object 模式挂载，而不是数组
      const mounted = (parent.subModels as any)['array'];
      expect(Array.isArray(mounted)).toBe(false);
      expect(mounted?.uid).toBe('c1');
      expect(mounted).toBe(child);
    });

    it('should add to array subModels when subType=array', async () => {
      const parent = engine.createModel({ uid: 'p2', use: 'FlowModel' });

      repo.findOneResult = {
        uid: 'c2',
        use: 'FlowModel',
        parentId: parent.uid,
        subKey: 'items',
        subType: 'array',
      };

      const child = await engine.loadOrCreateModel({
        uid: 'c2',
        use: 'FlowModel',
        parentId: parent.uid,
        subKey: 'items',
        subType: 'array',
      });

      expect(child).toBeTruthy();
      const arr = (parent.subModels as any)['items'];
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBe(1);
      expect(arr[0].uid).toBe('c2');
    });

    it('should create and save when repo has no data, then mount under parent accordingly (object case)', async () => {
      const parent = engine.createModel({ uid: 'p3', use: 'FlowModel' });

      // 仓库查无数据
      repo.findOneResult = null;

      const child = await engine.loadOrCreateModel({
        uid: 'c3',
        use: 'FlowModel',
        parentId: parent.uid,
        subKey: 'info',
        subType: 'object',
      });

      expect(child).toBeTruthy();
      // 应触发一次保存（create 后会调用 save）
      expect(repo.save).toHaveBeenCalledTimes(1);

      // 正确以对象形式挂载
      const mounted = (parent.subModels as any)['info'];
      expect(Array.isArray(mounted)).toBe(false);
      expect(mounted?.uid).toBe('c3');
    });
  });

  describe('getSubclassesOfAsync', () => {
    it('should return async-loaded subclasses matching extends declaration', async () => {
      class AsyncSubModelD extends BaseModel {}
      class AsyncSubModelE extends BaseModel {}

      engine.registerModelLoaders({
        AsyncSubModelD: {
          extends: 'BaseModel',
          loader: async () => ({ AsyncSubModelD }),
        },
        AsyncSubModelE: {
          extends: 'BaseModel',
          loader: async () => ({ AsyncSubModelE }),
        },
      });

      const result = await engine.getSubclassesOfAsync(BaseModel);

      // Sync-registered subclasses
      expect(result.has('SubModelA')).toBe(true);
      expect(result.has('SubModelB')).toBe(true);
      expect(result.has('SubModelC')).toBe(true);
      // Async-loaded subclasses
      expect(result.has('AsyncSubModelD')).toBe(true);
      expect(result.has('AsyncSubModelE')).toBe(true);
      // Base class excluded
      expect(result.has('BaseModel')).toBe(false);
    });

    it('should merge sync-registered and async-loaded subclasses', async () => {
      class AsyncSubModel extends BaseModel {}

      engine.registerModelLoaders({
        AsyncSubModel: {
          extends: 'BaseModel',
          loader: async () => ({ AsyncSubModel }),
        },
      });

      const result = await engine.getSubclassesOfAsync('BaseModel');

      // Sync: SubModelA, SubModelB, SubModelC
      expect(result.has('SubModelA')).toBe(true);
      expect(result.has('SubModelB')).toBe(true);
      expect(result.has('SubModelC')).toBe(true);
      // Async
      expect(result.has('AsyncSubModel')).toBe(true);
      expect(result.size).toBe(4);
    });

    it('should support extends as string array (multiple parents)', async () => {
      class AnotherBase extends FlowModel {}
      class MultiParentModel extends BaseModel {}

      engine.registerModels({ AnotherBase });
      engine.registerModelLoaders({
        MultiParentModel: {
          extends: ['BaseModel', 'AnotherBase'],
          loader: async () => ({ MultiParentModel }),
        },
      });

      const resultBase = await engine.getSubclassesOfAsync(BaseModel);
      expect(resultBase.has('MultiParentModel')).toBe(true);

      // Also found by AnotherBase (even though actual inheritance is from BaseModel, not AnotherBase)
      // The extends declaration triggers loading, but isInheritedFrom validation will exclude it from AnotherBase results
      const resultAnother = await engine.getSubclassesOfAsync(AnotherBase);
      expect(resultAnother.has('MultiParentModel')).toBe(false);
    });

    it('should support extends as ModelConstructor', async () => {
      class AsyncCtorSubModel extends BaseModel {}

      engine.registerModelLoaders({
        AsyncCtorSubModel: {
          extends: BaseModel,
          loader: async () => ({ AsyncCtorSubModel }),
        },
      });

      const result = await engine.getSubclassesOfAsync(BaseModel);
      expect(result.has('AsyncCtorSubModel')).toBe(true);
    });

    it('should validate actual inheritance and warn on mismatch', async () => {
      class UnrelatedModel extends FlowModel {}
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      engine.registerModelLoaders({
        UnrelatedModel: {
          extends: 'BaseModel',
          loader: async () => ({ UnrelatedModel }),
        },
      });

      const result = await engine.getSubclassesOfAsync(BaseModel);
      expect(result.has('UnrelatedModel')).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("declares extends 'BaseModel' but does not actually inherit from it"),
      );

      warnSpy.mockRestore();
    });

    it('should resolve base class from loaders if not in _modelClasses', async () => {
      const freshEngine = new FlowEngine();

      class LazyBase extends FlowModel {}
      class LazySub extends LazyBase {}

      freshEngine.registerModelLoaders({
        LazyBase: {
          loader: async () => ({ LazyBase }),
        },
        LazySub: {
          extends: 'LazyBase',
          loader: async () => ({ LazySub }),
        },
      });

      const result = await freshEngine.getSubclassesOfAsync('LazyBase');
      expect(result.has('LazySub')).toBe(true);
      expect(result.size).toBe(1);
    });

    it('should return empty Map when base class cannot be found', async () => {
      const result = await engine.getSubclassesOfAsync('NonExistentModel');
      expect(result.size).toBe(0);
    });

    it('should support filter parameter on both sync and async sources', async () => {
      class FilteredAsyncModel extends BaseModel {}

      engine.registerModelLoaders({
        FilteredAsyncModel: {
          extends: 'BaseModel',
          loader: async () => ({ FilteredAsyncModel }),
        },
      });

      const result = await engine.getSubclassesOfAsync(BaseModel, (_ModelClass, name) => name.startsWith('SubModelA'));

      // Only SubModelA passes the filter (SubModelB, SubModelC, FilteredAsyncModel excluded)
      expect(result.has('SubModelA')).toBe(true);
      expect(result.has('SubModelB')).toBe(false);
      expect(result.has('SubModelC')).toBe(false);
      expect(result.has('FilteredAsyncModel')).toBe(false);
    });

    it('should not include loaders without extends declaration', async () => {
      class NoExtendsModel extends BaseModel {}

      engine.registerModelLoaders({
        NoExtendsModel: {
          loader: async () => ({ NoExtendsModel }),
        },
      });

      const result = await engine.getSubclassesOfAsync(BaseModel);
      // Only sync-registered subclasses; NoExtendsModel has no extends, so not discovered
      expect(result.has('NoExtendsModel')).toBe(false);
      expect(result.has('SubModelA')).toBe(true);
    });
  });
});
