/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SingleRecordResource } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { EditFormModel } from '../EditFormModel';
import { submitHandler } from '../submitHandler';

describe('submitHandler', () => {
  it('merges assigned values into submitted values and lets assigned values override form values', async () => {
    const resource = Object.create(SingleRecordResource.prototype);
    resource.save = vi.fn(async () => ({ data: { id: 1 } }));

    const blockModel = {
      form: {
        validateFields: vi.fn(async () => undefined),
        getFieldsValue: vi.fn(() => ({
          title: 'Draft title',
          status: 'draft',
        })),
        resetFields: vi.fn(),
      },
      emitter: {
        emit: vi.fn(),
      },
      resetUserModifiedFields: vi.fn(),
      formValueRuntime: {
        resetAfterFormReset: vi.fn(),
      },
      collection: {
        name: 'posts',
      },
    };

    const ctx = {
      resource,
      blockModel,
      model: {
        getStepParams: vi.fn(),
      },
      view: {
        inputArgs: {},
      },
      message: {
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    const responseRecord = await submitHandler(ctx, {
      assignedValues: {
        status: 'published',
        reviewer: 'Alice',
      },
    });

    expect(responseRecord).toEqual({ id: 1 });
    expect(resource.save).toHaveBeenCalledWith(
      {
        title: 'Draft title',
        status: 'published',
        reviewer: 'Alice',
      },
      undefined,
    );
  });

  it('returns the refreshed record for edit forms when the save response is empty', async () => {
    const refreshedRecord = { id: 2, title: 'Updated title' };
    const resource = Object.create(SingleRecordResource.prototype);
    resource.getMeta = vi.fn((key: string) => (key === 'currentFilterByTk' ? 2 : undefined));
    resource.setFilterByTk = vi.fn(() => resource);
    resource.save = vi.fn(async () => undefined);
    resource.refresh = vi.fn(async () => undefined);
    resource.getData = vi.fn(() => refreshedRecord);

    const blockModel = Object.create(EditFormModel.prototype);
    const form = {
      validateFields: vi.fn(async () => undefined),
      getFieldsValue: vi.fn(() => ({
        title: 'Updated title',
      })),
    };
    Object.defineProperty(blockModel, 'context', { value: { form } });
    Object.defineProperty(blockModel, 'collection', {
      value: {
        name: 'posts',
        getFilterByTK: (record: { id?: number }) => record.id,
      },
    });
    blockModel.resetUserModifiedFields = vi.fn();

    const responseRecord = await submitHandler(
      {
        resource,
        blockModel,
        model: {
          getStepParams: vi.fn(),
        },
        message: {
          error: vi.fn(),
        },
        t: (value: string) => value,
      },
      {},
    );

    expect(responseRecord).toBe(refreshedRecord);
    expect(resource.setFilterByTk).toHaveBeenCalledWith(2);
    expect(resource.save).toHaveBeenCalledWith(
      {
        title: 'Updated title',
      },
      undefined,
    );
    expect(resource.refresh).toHaveBeenCalled();
  });
});
