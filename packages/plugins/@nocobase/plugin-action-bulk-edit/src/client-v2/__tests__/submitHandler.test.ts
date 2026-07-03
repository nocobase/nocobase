/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { submitHandler } from '../submitHandler';

type SelectedRow = {
  id?: number | null;
};

type UpdatePayload = {
  filter?: unknown;
  values?: unknown;
  forceUpdate?: boolean;
  triggerWorkflows?: string;
};

type CreateContextOptions = {
  rows?: SelectedRow[];
  updateMode?: 'selected' | 'all';
  collection?: {
    name: string;
    dataSourceKey?: string;
  };
  collectionFilter?: unknown;
};

function createContext(options: CreateContextOptions = {}) {
  const values = {
    title: 'Updated title',
  };
  const update = vi.fn<(payload: UpdatePayload) => Promise<void>>().mockResolvedValue(undefined);
  const resetUserModifiedFields = vi.fn();
  const selectedRows = options.rows ?? [{ id: 1 }];
  const collectionFilter = options.collectionFilter;
  const collectionModel = {
    resource: {
      getSelectedRows: vi.fn(() => selectedRows),
      getFilter: vi.fn(() => collectionFilter),
    },
    context: {
      collection: options.collection ?? {
        name: 'posts',
        dataSourceKey: 'main',
      },
    },
  };
  const bulkEditActionModel = {
    parent: collectionModel,
    getStepParams: vi.fn(() => ({ value: options.updateMode ?? 'selected' })),
  };
  const resource = {
    update,
  };
  const ctx = {
    blockModel: {
      form: {
        validateFields: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        getFieldsValue: vi.fn(() => values),
      },
      resetUserModifiedFields,
    },
    view: {
      inputArgs: {
        viewUid: 'bulk-edit-action',
      },
    },
    engine: {
      getModel: vi.fn(() => bulkEditActionModel),
    },
    collection: {
      filterTargetKey: 'id',
      getPrimaryKey: vi.fn(() => 'id'),
      getFilterByTK: vi.fn((row: SelectedRow) => row.id),
    },
    api: {
      resource: vi.fn(() => resource),
    },
    message: {
      error: vi.fn(),
      success: vi.fn(),
    },
    t: (key: string) => key,
    exit: vi.fn(),
  };

  return {
    ctx,
    update,
    values,
    resource,
    collectionModel,
    bulkEditActionModel,
    resetUserModifiedFields,
  };
}

describe('submitHandler', () => {
  it('updates selected records by primary key and merges request params', async () => {
    const { ctx, update, values, resetUserModifiedFields } = createContext({
      rows: [{ id: 1 }, { id: null }, { id: 2 }],
    });

    await submitHandler(ctx, {
      requestConfig: {
        params: {
          triggerWorkflows: 'workflow-1',
        },
      },
    });

    expect(ctx.blockModel.form.validateFields).toHaveBeenCalledTimes(1);
    expect(ctx.blockModel.form.getFieldsValue).toHaveBeenCalledWith(true);
    expect(ctx.api.resource).toHaveBeenCalledWith('posts', null, {
      'x-data-source': 'main',
    });
    expect(update).toHaveBeenCalledWith({
      filter: {
        $and: [
          {
            id: {
              $in: [1, 2],
            },
          },
        ],
      },
      values,
      triggerWorkflows: 'workflow-1',
    });
    expect(resetUserModifiedFields).toHaveBeenCalledTimes(1);
    expect(ctx.message.success).toHaveBeenCalledWith('Saved successfully');
    expect(ctx.exit).not.toHaveBeenCalled();
  });

  it('falls back to id as the selected record filter key', async () => {
    const { ctx, update, values } = createContext({
      rows: [{ id: 3 }],
    });
    ctx.collection.filterTargetKey = undefined;
    ctx.collection.getPrimaryKey.mockReturnValue(undefined);

    await submitHandler(ctx, {});

    expect(update).toHaveBeenCalledWith({
      filter: {
        $and: [
          {
            id: {
              $in: [3],
            },
          },
        ],
      },
      values,
    });
  });

  it('exits early when selected mode has no selected records', async () => {
    const { ctx, update } = createContext({
      rows: [],
    });

    await submitHandler(ctx, {});

    expect(ctx.message.error).toHaveBeenCalledWith('Please select the records to be edited');
    expect(ctx.exit).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  it('updates the whole collection with forceUpdate when no filter is available', async () => {
    const { ctx, update, values } = createContext({
      updateMode: 'all',
      collectionFilter: undefined,
    });

    await submitHandler(ctx, {
      requestConfig: {
        params: {
          triggerWorkflows: 'workflow-2',
        },
      },
    });

    expect(ctx.collection.getFilterByTK).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      values,
      forceUpdate: true,
      triggerWorkflows: 'workflow-2',
    });
    expect(ctx.message.success).toHaveBeenCalledWith('Saved successfully');
  });

  it('uses the collection resource filter in all mode when present', async () => {
    const filter = {
      status: {
        $eq: 'draft',
      },
    };
    const { ctx, update, values } = createContext({
      updateMode: 'all',
      collectionFilter: filter,
    });

    await submitHandler(ctx, {});

    expect(update).toHaveBeenCalledWith({
      filter,
      values,
    });
  });

  it('exits when the collection metadata is missing', async () => {
    const { ctx, update, resetUserModifiedFields } = createContext({
      collection: undefined,
    });
    ctx.engine.getModel = vi.fn(() => ({
      parent: {
        resource: {
          getSelectedRows: vi.fn(() => [{ id: 1 }]),
        },
        context: {},
      },
      getStepParams: vi.fn(() => ({ value: 'selected' })),
    }));

    await submitHandler(ctx, {});

    expect(ctx.message.error).toHaveBeenCalledWith('Collection not found');
    expect(ctx.exit).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(resetUserModifiedFields).not.toHaveBeenCalled();
  });
});
