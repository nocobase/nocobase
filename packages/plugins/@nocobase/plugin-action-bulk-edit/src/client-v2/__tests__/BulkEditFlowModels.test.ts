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
import { BulkEditActionModel } from '../flow/models/BulkEditActionModel';
import { BulkEditFormModel } from '../flow/models/BulkEditFormModel';
import { BulkEditFormSubmitActionModel } from '../flow/models/BulkEditFormSubmitActionModel';

describe('bulk edit flow models', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates popup action metadata and returns update ACL action', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ BulkEditActionModel });
    const action = engine.createModel<BulkEditActionModel>({
      uid: 'bulk-edit-action',
      use: 'BulkEditActionModel',
    });

    const createModelOptions = BulkEditActionModel.meta?.createModelOptions;

    expect(action.getAclActionName()).toBe('update');
    expect(BulkEditActionModel.scene).toBe('collection');
    expect(BulkEditActionModel.capabilityActionName).toBe('updateMany');
    expect(typeof createModelOptions).toBe('function');
    await expect(createModelOptions?.({} as never, {} as never)).resolves.toMatchObject({
      use: 'BulkEditActionModel',
      subModels: {
        page: {
          use: 'ChildPageModel',
          async: true,
          subModels: {
            tabs: [
              {
                use: 'BulkEditChildPageTabModel',
              },
            ],
          },
        },
      },
    });
  });

  it('creates bulk edit form model options from view input args', async () => {
    const createModelOptions = BulkEditFormModel.meta?.createModelOptions;

    expect(new BulkEditFormModel({ uid: 'bulk-edit-form', flowEngine: new FlowEngine() }).getAclActionName()).toBe(
      'update',
    );
    expect(typeof createModelOptions).toBe('function');
    await expect(
      createModelOptions?.(
        {
          view: {
            inputArgs: {
              collectionName: 'posts',
              dataSourceKey: 'main',
            },
          },
        } as never,
        {} as never,
      ),
    ).resolves.toMatchObject({
      use: 'BulkEditFormModel',
      subModels: {
        grid: {
          use: 'BulkEditFormGridModel',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'posts',
          },
        },
      },
    });
  });

  it('verifies selected records before submitting', async () => {
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-action',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('verifySelectedRecords')?.serialize().handler;
    const ctx = {
      view: {
        inputArgs: {
          viewUid: 'bulk-edit-action',
        },
      },
      engine: {
        getModel: vi.fn(() => ({
          parent: {
            resource: {
              getSelectedRows: vi.fn(() => []),
            },
          },
          getStepParams: vi.fn(() => ({ value: 'selected' })),
        })),
      },
      message: {
        error: vi.fn(),
      },
      exit: vi.fn(),
    };

    expect(handler).toBeTypeOf('function');
    await handler?.(ctx as never, {} as never);

    expect(ctx.message.error).toHaveBeenCalledWith('Please select the records to be edited');
    expect(ctx.exit).toHaveBeenCalledTimes(1);
  });

  it('skips selected-record verification when editing the whole collection', async () => {
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-action-all',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('verifySelectedRecords')?.serialize().handler;
    const ctx = {
      view: {
        inputArgs: {
          viewUid: 'bulk-edit-action',
        },
      },
      engine: {
        getModel: vi.fn(() => ({
          parent: {
            resource: {
              getSelectedRows: vi.fn(() => []),
            },
          },
          getStepParams: vi.fn(() => ({ value: 'all' })),
        })),
      },
      message: {
        error: vi.fn(),
      },
      exit: vi.fn(),
    };

    await handler?.(ctx as never, {} as never);

    expect(ctx.message.error).not.toHaveBeenCalled();
    expect(ctx.exit).not.toHaveBeenCalled();
  });

  it('handles submit confirmation cancel and validation failures', async () => {
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-confirm',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('confirm')?.serialize().handler;
    const ctx = {
      form: {
        validateFields: vi
          .fn<() => Promise<void>>()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('invalid')),
      },
      modal: {
        confirm: vi.fn<() => Promise<boolean>>().mockResolvedValue(false),
      },
      t: (key: string) => `t:${key}`,
      exit: vi.fn(),
    };

    await handler?.(
      ctx as never,
      {
        enable: false,
      } as never,
    );
    await handler?.(
      ctx as never,
      {
        content: 'Are you sure?',
        enable: true,
        title: 'Submit record',
      } as never,
    );
    await handler?.(
      ctx as never,
      {
        content: 'Are you sure?',
        enable: true,
        title: 'Submit record',
      } as never,
    );

    expect(ctx.modal.confirm).toHaveBeenCalledWith({
      cancelText: 't:Cancel',
      content: 't:Are you sure?',
      okText: 't:Confirm',
      title: 't:Submit record',
    });
    expect(ctx.exit).toHaveBeenCalledTimes(2);
  });

  it('runs saveResource with loading state and updates all records', async () => {
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-save',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('saveResource')?.serialize().handler;
    const setProps = vi.fn();
    const update = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const ctx = {
      resource: {},
      model: {
        setProps,
      },
      blockModel: {
        form: {
          validateFields: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
          getFieldsValue: vi.fn(() => ({ title: 'Updated' })),
        },
        resetUserModifiedFields: vi.fn(),
      },
      view: {
        inputArgs: {
          viewUid: 'bulk-edit-action',
        },
      },
      engine: {
        getModel: vi.fn(() => ({
          parent: {
            resource: {
              getFilter: vi.fn(() => undefined),
            },
            context: {
              collection: {
                name: 'posts',
                dataSourceKey: 'main',
              },
            },
          },
          getStepParams: vi.fn(() => ({ value: 'all' })),
        })),
      },
      collection: {
        getPrimaryKey: vi.fn(() => 'id'),
        getFilterByTK: vi.fn(),
      },
      api: {
        resource: vi.fn(() => ({
          update,
        })),
      },
      message: {
        success: vi.fn(),
        error: vi.fn(),
      },
      t: (key: string) => key,
      exit: vi.fn(),
    };

    expect(handler).toBeTypeOf('function');
    await handler?.(
      ctx as never,
      {
        requestConfig: {
          params: {
            triggerWorkflows: 'workflow-1',
          },
        },
      } as never,
    );

    expect(setProps).toHaveBeenNthCalledWith(1, 'loading', true);
    expect(update).toHaveBeenCalledWith({
      values: { title: 'Updated' },
      forceUpdate: true,
      triggerWorkflows: 'workflow-1',
    });
    expect(setProps).toHaveBeenNthCalledWith(2, 'loading', false);
    expect(ctx.exit).not.toHaveBeenCalled();
  });

  it('throws when saveResource runs without required runtime context', async () => {
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-missing-context',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('saveResource')?.serialize().handler;

    await expect(handler?.({} as never, {} as never)).rejects.toThrow('Resource is not initialized');
    await expect(handler?.({ resource: {} } as never, {} as never)).rejects.toThrow('Block model is not initialized');
  });

  it('exits and clears loading when saveResource catches submit errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-error',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('saveResource')?.serialize().handler;
    const ctx = {
      resource: {},
      model: {
        setProps: vi.fn(),
      },
      blockModel: {
        form: {
          validateFields: vi.fn<() => Promise<void>>().mockRejectedValue(new Error('invalid')),
        },
      },
      exit: vi.fn(),
    };

    try {
      await handler?.(ctx as never, {} as never);
    } finally {
      consoleError.mockRestore();
    }

    expect(ctx.model.setProps).toHaveBeenNthCalledWith(1, 'loading', true);
    expect(ctx.model.setProps).toHaveBeenNthCalledWith(2, 'loading', false);
    expect(ctx.exit).toHaveBeenCalledTimes(1);
  });

  it('refreshes the source block and closes the view after submit', async () => {
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-refresh',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('refreshAndClose')?.serialize().handler;
    const refresh = vi.fn();
    const close = vi.fn();
    const ctx = {
      view: {
        inputArgs: {
          viewUid: 'bulk-edit-action',
        },
        close,
      },
      engine: {
        getModel: vi.fn(() => ({
          context: {
            blockModel: {
              resource: {
                refresh,
              },
            },
          },
        })),
      },
    };

    expect(handler).toBeTypeOf('function');
    await handler?.(ctx as never, {} as never);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes the view even when the source action model is unavailable', async () => {
    const model = new BulkEditFormSubmitActionModel({
      uid: 'bulk-edit-submit-refresh-missing-action',
      flowEngine: new FlowEngine(),
    });
    const handler = model.getFlow('submitSettings')?.getStep('refreshAndClose')?.serialize().handler;
    const close = vi.fn();
    const ctx = {
      view: {
        inputArgs: {
          viewUid: 'bulk-edit-action',
        },
        close,
      },
      engine: {
        getModel: vi.fn(() => null),
      },
    };

    await handler?.(ctx as never, {} as never);

    expect(close).toHaveBeenCalledTimes(1);
  });
});
