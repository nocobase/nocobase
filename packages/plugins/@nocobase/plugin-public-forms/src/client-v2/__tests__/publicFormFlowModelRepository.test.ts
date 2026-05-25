/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicFormLayoutModel } from '../models/PublicFormLayoutModel';
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
});
