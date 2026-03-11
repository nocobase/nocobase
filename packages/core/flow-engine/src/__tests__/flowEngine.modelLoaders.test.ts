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
import { ErrorFlowModel, FlowModel } from '../models';
import type { IFlowModelRepository } from '../types';

class MockFlowModelRepository implements IFlowModelRepository {
  findOneResult: any = null;
  save = vi.fn(async (model: FlowModel) => ({ success: true, uid: model.uid }));

  async findOne() {
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

describe('FlowEngine model loaders', () => {
  let engine: FlowEngine;
  let repo: MockFlowModelRepository;

  beforeEach(() => {
    engine = new FlowEngine();
    repo = new MockFlowModelRepository();
    engine.setModelRepository(repo);
  });

  it('resolves explicit and meta-default model trees before synchronous creation', async () => {
    class ParentModel extends FlowModel {}
    class ChildModel extends FlowModel {}
    class DefaultChildModel extends FlowModel {}

    ParentModel.define({
      createModelOptions: {
        subModels: {
          defaultChild: {
            use: 'DefaultChildModel',
          },
        },
      },
    });

    const parentLoader = vi.fn(async () => ({ ParentModel }));
    const childLoader = vi.fn(async () => ({ ChildModel }));
    const defaultChildLoader = vi.fn(async () => ({ DefaultChildModel }));

    engine.registerModelLoaders({
      ParentModel: { loader: parentLoader },
      ChildModel: { loader: childLoader },
      DefaultChildModel: { loader: defaultChildLoader },
    });

    const model = await engine.loadOrCreateModel({
      uid: 'parent-model',
      use: 'ParentModel',
      subModels: {
        child: {
          use: 'ChildModel',
        },
      },
    });

    expect(model).toBeInstanceOf(ParentModel);
    expect(model?.subModels.child).toBeInstanceOf(ChildModel);
    expect(model?.subModels.defaultChild).toBeInstanceOf(DefaultChildModel);
    expect(parentLoader).toHaveBeenCalledTimes(1);
    expect(childLoader).toHaveBeenCalledTimes(1);
    expect(defaultChildLoader).toHaveBeenCalledTimes(1);
  });

  it('resolves repository-loaded model trees before loadModel creates instances', async () => {
    class RepoRootModel extends FlowModel {}
    class RepoChildModel extends FlowModel {}

    const rootLoader = vi.fn(async () => ({ RepoRootModel }));
    const childLoader = vi.fn(async () => ({ RepoChildModel }));

    engine.registerModelLoaders({
      RepoRootModel: { loader: rootLoader },
      RepoChildModel: { loader: childLoader },
    });

    repo.findOneResult = {
      uid: 'repo-root',
      use: 'RepoRootModel',
      subModels: {
        child: {
          use: 'RepoChildModel',
        },
      },
    };

    const model = await engine.loadModel({ uid: 'repo-root' });

    expect(model).toBeInstanceOf(RepoRootModel);
    expect(model?.subModels.child).toBeInstanceOf(RepoChildModel);
    expect(rootLoader).toHaveBeenCalledTimes(1);
    expect(childLoader).toHaveBeenCalledTimes(1);
  });

  it('supports async model creation and async getters', async () => {
    class AsyncRootModel extends FlowModel {}
    class AsyncChildModel extends FlowModel {}

    const rootLoader = vi.fn(async () => ({ AsyncRootModel }));
    const childLoader = vi.fn(async () => ({ AsyncChildModel }));

    engine.registerModelLoaders({
      AsyncRootModel: { loader: rootLoader },
      AsyncChildModel: { loader: childLoader },
    });

    const rootClass = await engine.getModelClassAsync('AsyncRootModel');
    const classes = await engine.getModelClassesAsync();
    const model = await engine.createModelAsync({
      uid: 'async-root',
      use: 'AsyncRootModel',
      subModels: {
        child: {
          use: 'AsyncChildModel',
        },
      },
    });

    expect(rootClass).toBe(AsyncRootModel);
    expect(classes.get('AsyncRootModel')).toBe(AsyncRootModel);
    expect(classes.get('AsyncChildModel')).toBe(AsyncChildModel);
    expect(model).toBeInstanceOf(AsyncRootModel);
    expect(model.subModels.child).toBeInstanceOf(AsyncChildModel);
    expect(rootLoader).toHaveBeenCalledTimes(1);
    expect(childLoader).toHaveBeenCalledTimes(1);
  });

  it('keeps loader resolution idempotent across prepareModelTree and flow settings preload', async () => {
    class RuntimeResolvedModel extends FlowModel {}
    class DesignResolvedModel extends FlowModel {}

    const runtimeLoader = vi.fn(async () => ({ RuntimeResolvedModel }));
    const designLoader = vi.fn(async () => ({ DesignResolvedModel }));

    engine.registerModelLoaders({
      RuntimeResolvedModel: { loader: runtimeLoader },
      DesignResolvedModel: { loader: designLoader },
    });

    await engine.prepareModelTree({
      use: 'RuntimeResolvedModel',
    });

    const firstPreload = await engine.prepareFlowSettingsMode();
    const secondPreload = await engine.prepareFlowSettingsMode();

    expect(runtimeLoader).toHaveBeenCalledTimes(1);
    expect(designLoader).toHaveBeenCalledTimes(1);
    expect(firstPreload.loaded).toContain('DesignResolvedModel');
    expect(firstPreload.loaded).not.toContain('RuntimeResolvedModel');
    expect(secondPreload.loaded).toHaveLength(0);
    expect(secondPreload.failed).toHaveLength(0);
  });

  it('degrades unresolved loader failures to ErrorFlowModel instead of crashing runtime creation', async () => {
    class ParentModel extends FlowModel {}

    const parentLoader = vi.fn(async () => ({ ParentModel }));
    const invalidChildLoader = vi.fn(async () => ({ notAModel: {} }));

    engine.registerModelLoaders({
      ParentModel: { loader: parentLoader },
      BrokenChildModel: { loader: invalidChildLoader as any },
    });

    const model = await engine.loadOrCreateModel({
      uid: 'parent-with-broken-child',
      use: 'ParentModel',
      subModels: {
        child: {
          use: 'BrokenChildModel',
        },
      },
    });

    expect(model).toBeInstanceOf(ParentModel);
    expect(model?.subModels.child).toBeInstanceOf(ErrorFlowModel);
    expect(parentLoader).toHaveBeenCalledTimes(1);
    expect(invalidChildLoader).toHaveBeenCalledTimes(1);
  });
});
