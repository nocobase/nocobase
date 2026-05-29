/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockGridModel, ChildPageTabModel, CreateFormModel, FormGridModel, RouteModel } from '@nocobase/client-v2';
import type { LayoutRouteMatch } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_FORM_LAYOUT_UID } from '../constants';
import { PublicFormLayoutModel } from '../models/PublicFormLayoutModel';
import { PublicFormPageModel } from '../models/PublicFormPageModel';
import { PublicFormFlowModelRepository } from '../publicFormFlowModelRepository';

describe('PublicFormFlowModelRepository', () => {
  it('loads public form child models from public form action', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: {
          uid: 'popup-grid',
          use: 'BlockGridModel',
        },
      },
    }));
    const delegate = {
      findOne: vi.fn(),
    };
    const repository = new PublicFormFlowModelRepository({
      app: {
        apiClient: {
          request,
        },
      },
      formKey: 'pf1',
      delegate: delegate as any,
    });

    const result = await repository.findOne({
      parentId: 'field1',
      subKey: 'grid-block',
    });

    expect(result).toEqual({
      uid: 'popup-grid',
      use: 'BlockGridModel',
    });
    expect(request).toHaveBeenCalledWith({
      url: 'publicForms:getFlowModel/pf1',
      skipAuth: true,
      params: {
        parentId: 'field1',
        subKey: 'grid-block',
      },
    });
    expect(delegate.findOne).not.toHaveBeenCalled();
  });

  it('loads public form models by uid from public form action', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: {
          uid: 'popup-grid',
          use: 'BlockGridModel',
        },
      },
    }));
    const delegate = {
      findOne: vi.fn(),
    };
    const repository = new PublicFormFlowModelRepository({
      app: {
        apiClient: {
          request,
        },
      },
      formKey: 'pf1',
      delegate: delegate as any,
    });

    await expect(repository.findOne({ uid: 'popup-grid' })).resolves.toEqual({
      uid: 'popup-grid',
      use: 'BlockGridModel',
    });
    expect(request).toHaveBeenCalledWith({
      url: 'publicForms:getFlowModel/pf1',
      skipAuth: true,
      params: {
        uid: 'popup-grid',
      },
    });
    expect(delegate.findOne).not.toHaveBeenCalled();
  });

  it('delegates model queries before the public form key is ready', async () => {
    const request = vi.fn();
    const delegate = {
      findOne: vi.fn(async () => ({ uid: 'root' })),
    };
    const repository = new PublicFormFlowModelRepository({
      app: {
        apiClient: {
          request,
        },
      },
      delegate: delegate as any,
    });

    await expect(repository.findOne({ uid: 'root' })).resolves.toEqual({ uid: 'root' });
    expect(request).not.toHaveBeenCalled();
    expect(delegate.findOne).toHaveBeenCalledWith({ uid: 'root' });
  });
});

describe('PublicFormLayoutModel public form repository binding', () => {
  const warn = console.warn;

  afterEach(() => {
    console.warn = warn;
  });

  it('installs repository wrapper while mounted and restores it on unmount', async () => {
    console.warn = vi.fn();
    const flowEngine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { data: { uid: 'popup-grid' } } }));
    const delegate = {
      findOne: vi.fn(async () => ({ uid: 'delegate-model' })),
      save: vi.fn(),
      destroy: vi.fn(),
      move: vi.fn(),
      duplicate: vi.fn(),
    };

    flowEngine.context.defineProperty('app', {
      value: {
        apiClient: {
          request,
        },
      },
    });
    flowEngine.setModelRepository(delegate as any);
    flowEngine.registerModels({ PublicFormLayoutModel });

    const model = flowEngine.createModel<PublicFormLayoutModel>({
      uid: 'public-form-layout',
      use: 'PublicFormLayoutModel',
    });
    (model as any).onMount();
    model.setPublicFormKey('pf1');

    const publicRepository = flowEngine.modelRepository;
    await expect(
      publicRepository?.findOne({
        parentId: 'field1',
        subKey: 'grid-block',
      }),
    ).resolves.toEqual({ uid: 'popup-grid' });
    expect(request).toHaveBeenCalledWith({
      url: 'publicForms:getFlowModel/pf1',
      skipAuth: true,
      params: {
        parentId: 'field1',
        subKey: 'grid-block',
      },
    });

    (model as any).onUnmount();
    expect(flowEngine.modelRepository).toBe(delegate);
  });

  it('keeps the public form key when it is set before repository setup', async () => {
    console.warn = vi.fn();
    const flowEngine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { data: { uid: 'popup-grid' } } }));
    const delegate = {
      findOne: vi.fn(async () => ({ uid: 'delegate-model' })),
      save: vi.fn(),
      destroy: vi.fn(),
      move: vi.fn(),
      duplicate: vi.fn(),
    };

    flowEngine.context.defineProperty('app', {
      value: {
        apiClient: {
          request,
        },
      },
    });
    flowEngine.setModelRepository(delegate as any);
    flowEngine.registerModels({ PublicFormLayoutModel });

    const model = flowEngine.createModel<PublicFormLayoutModel>({
      uid: 'public-form-layout',
      use: 'PublicFormLayoutModel',
    });
    model.setPublicFormKey('pf1');
    (model as any).onMount();

    await expect(
      flowEngine.modelRepository?.findOne({
        parentId: 'field1',
        subKey: 'grid-block',
      }),
    ).resolves.toEqual({ uid: 'popup-grid' });
    expect(request).toHaveBeenCalledWith({
      url: 'publicForms:getFlowModel/pf1',
      skipAuth: true,
      params: {
        parentId: 'field1',
        subKey: 'grid-block',
      },
    });
    expect(delegate.findOne).not.toHaveBeenCalled();

    (model as any).onUnmount();
  });

  it('applies public form collections to layout context without mutating the global data source manager', () => {
    const flowEngine = new FlowEngine();
    const globalDataSourceManager = flowEngine.context.dataSourceManager;
    globalDataSourceManager.getDataSource('main')?.setCollections([{ name: 'users', fields: [] } as any]);
    flowEngine.registerModels({ PublicFormLayoutModel });

    const model = flowEngine.createModel<PublicFormLayoutModel>({
      uid: 'public-form-layout',
      use: 'PublicFormLayoutModel',
    });
    (model as any).onMount();

    model.applyPublicDataSource({
      key: 'main',
      displayName: 'Main',
      collections: [{ name: 'orders', fields: [] } as any],
    });

    const localDataSourceManager = model.context.dataSourceManager;
    expect(localDataSourceManager).not.toBe(globalDataSourceManager);
    expect(localDataSourceManager.getDataSource('main')?.getCollection('orders')).toBeTruthy();
    expect(globalDataSourceManager.getDataSource('main')?.getCollection('users')).toBeTruthy();
    expect(globalDataSourceManager.getDataSource('main')?.getCollection('orders')).toBeFalsy();

    (model as any).onUnmount();
  });

  it('resolves public form collections before detached page context is attached', () => {
    const flowEngine = new FlowEngine();
    flowEngine.registerModels({
      PublicFormLayoutModel,
      PublicFormPageModel,
      RouteModel,
      ChildPageTabModel,
      BlockGridModel,
      CreateFormModel,
      FormGridModel,
    });

    const layoutModel = flowEngine.createModel<PublicFormLayoutModel>({
      uid: PUBLIC_FORM_LAYOUT_UID,
      use: 'PublicFormLayoutModel',
    });
    (layoutModel as any).onMount();
    const publicFormRoute: LayoutRouteMatch = {
      type: 'page',
      pathname: '/public-forms/pf1',
      basePathname: '/public-forms',
      relativePath: 'pf1',
      pageUid: 'pf1',
      viewStack: [],
    };
    layoutModel.currentLayoutRoute = publicFormRoute;
    layoutModel.applyPublicDataSource({
      key: 'main',
      displayName: 'Main',
      collections: [{ name: 'users', fields: [] } as any],
    });

    flowEngine.createModel({
      uid: 'pf1',
      use: 'RouteModel',
      subModels: {
        page: {
          use: 'PublicFormPageModel',
          subModels: {
            tabs: [
              {
                use: 'ChildPageTabModel',
                subModels: {
                  grid: {
                    use: 'BlockGridModel',
                    subModels: {
                      items: [
                        {
                          uid: 'form-block',
                          use: 'CreateFormModel',
                          stepParams: {
                            resourceSettings: {
                              init: {
                                dataSourceKey: 'main',
                                collectionName: 'users',
                              },
                            },
                          },
                          subModels: {
                            grid: {
                              use: 'FormGridModel',
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });

    const formBlock = flowEngine.getModel<CreateFormModel>('form-block');
    expect(formBlock?.context.dataSourceManager).toBe(layoutModel.context.dataSourceManager);
    expect(formBlock?.context.collection?.name).toBe('users');

    (layoutModel as any).onUnmount();
  });
});
