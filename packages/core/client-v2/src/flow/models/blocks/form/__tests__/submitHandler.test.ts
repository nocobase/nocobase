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

    await submitHandler(ctx, {
      assignedValues: {
        status: 'published',
        reviewer: 'Alice',
      },
    });

    expect(resource.save).toHaveBeenCalledWith(
      {
        title: 'Draft title',
        status: 'published',
        reviewer: 'Alice',
      },
      undefined,
    );
  });
});
