/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// ActionGroupModel.test.tsx
import { beforeEach, describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { ActionGroupModel, ActionModel, ActionSceneEnum } from '../../..'; // 可解决循环依赖问题

describe('ActionGroupModel.registerActionModels', () => {
  class MockAction1 {}
  class MockAction2 {}
  class MockAction3 {}
  let TestActionGroupModel: typeof ActionGroupModel;

  beforeEach(() => {
    TestActionGroupModel = class extends ActionGroupModel {};
  });

  it('registers action models and sets their names', () => {
    TestActionGroupModel.registerActionModels({
      Foo: MockAction1,
      Bar: MockAction2,
    });

    const models = TestActionGroupModel.currentModels;
    expect(models.size).toBe(2);
    expect(models.get('Foo')).toBe(MockAction1);
    expect(models.get('Bar')).toBe(MockAction2);

    expect(MockAction1.name).toBe('Foo');
    expect(MockAction2.name).toBe('Bar');
  });

  it('adds more models on subsequent calls', () => {
    TestActionGroupModel.registerActionModels({ Foo: MockAction1 });
    TestActionGroupModel.registerActionModels({ Bar: MockAction2 });

    const models = TestActionGroupModel.currentModels;
    expect(models.size).toBe(2);
    expect(models.get('Foo')).toBe(MockAction1);
    expect(models.get('Bar')).toBe(MockAction2);
  });

  it('overwrites model if same name is registered again', () => {
    TestActionGroupModel.registerActionModels({ Foo: MockAction1 });
    TestActionGroupModel.registerActionModels({ Foo: MockAction3 });

    const models = TestActionGroupModel.currentModels;
    expect(models.size).toBe(1);
    expect(models.get('Foo')).toBe(MockAction3);
    expect(MockAction3.name).toBe('Foo');
  });

  it('does not conflict between parent and child class registrations', () => {
    class ParentAction extends ActionGroupModel {}
    class ChildAction extends ParentAction {}

    class ParentModel {}
    class ChildModel {}

    ParentAction.registerActionModels({ Parent: ParentModel });
    ChildAction.registerActionModels({ Child: ChildModel });

    // 父类只包含自己的
    expect(Array.from(ParentAction.currentModels.keys())).toEqual(['Parent']);
    // 子类包含自己的和父类的
    expect(Array.from(ChildAction.currentModels.keys())).toEqual(['Child']);
    // 子类通过 models 能拿到父类和自己的
    expect(Array.from(ChildAction.models.keys()).sort()).toEqual(['Child', 'Parent']);
    // 父类 models 只包含自己的
    expect(Array.from(ParentAction.models.keys())).toEqual(['Parent']);
  });
  it('does not conflict between parallel subclasses of ActionGroupModel', () => {
    class SubActionA extends ActionGroupModel {}
    class SubActionB extends ActionGroupModel {}

    class ModelA {}
    class ModelB {}

    SubActionA.registerActionModels({ A: ModelA });
    SubActionB.registerActionModels({ B: ModelB });

    // 各自 currentModels 只包含自己的
    expect(Array.from(SubActionA.currentModels.keys())).toEqual(['A']);
    expect(Array.from(SubActionB.currentModels.keys())).toEqual(['B']);

    // 各自 models 也只包含自己的
    expect(Array.from(SubActionA.models.keys())).toEqual(['A']);
    expect(Array.from(SubActionB.models.keys())).toEqual(['B']);
  });

  it('filters out unsupported action models by collection availableActions', async () => {
    class SupportedActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;

      getAclActionName() {
        return 'create';
      }
    }

    SupportedActionModel.define({
      label: 'Supported action',
      sort: 10,
    });

    class UnsupportedActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;

      getAclActionName() {
        return 'destroy';
      }
    }

    UnsupportedActionModel.define({
      label: 'Unsupported action',
      sort: 20,
    });

    class TestCollectionActionGroupModel extends ActionGroupModel {
      static baseClass = ActionModel;
      static scene = ActionSceneEnum.collection;
    }

    const engine = new FlowEngine();
    engine.registerModels({
      TestCollectionActionGroupModel,
      SupportedActionModel,
      UnsupportedActionModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      availableActions: ['create'],
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });

    const ctx = {
      engine,
      dataSourceManager: engine.dataSourceManager,
      collection: ds.getCollection('posts'),
    } as any;

    const items = await TestCollectionActionGroupModel.defineChildren(ctx);

    expect(items.map((item: any) => item.useModel)).toEqual(['SupportedActionModel']);
  });

  it('allows action models to opt out of capability filtering explicitly', async () => {
    class NeutralActionModel extends ActionModel {
      static scene = ActionSceneEnum.collection;
      static capabilityActionName = null;

      getAclActionName() {
        return 'destroy';
      }
    }

    NeutralActionModel.define({
      label: 'Neutral action',
      sort: 10,
    });

    class TestCollectionActionGroupModel extends ActionGroupModel {
      static baseClass = ActionModel;
      static scene = ActionSceneEnum.collection;
    }

    const engine = new FlowEngine();
    engine.registerModels({
      TestCollectionActionGroupModel,
      NeutralActionModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      availableActions: ['create'],
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });

    const ctx = {
      engine,
      dataSourceManager: engine.dataSourceManager,
      collection: ds.getCollection('posts'),
    } as any;

    const items = await TestCollectionActionGroupModel.defineChildren(ctx);

    expect(items.map((item: any) => item.useModel)).toEqual(['NeutralActionModel']);
  });
});
