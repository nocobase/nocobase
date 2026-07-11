/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { JSRecordActionModel } from '../JSRecordActionModel';
import { createActionModel, JS_ACTION_SOURCE_BINDING } from './jsActionLightExtensionTestUtils';

describe('JSRecordActionModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves JS Action entries with the current record context', async () => {
    const resolve = vi.fn(() => ({
      code: `
ctx.__testState.recordName = ctx.record.name;
ctx.__testState.filterByTk = ctx.filterByTk;
ctx.message.success(ctx.settings.successMessage + ':' + ctx.record.id);
      `,
      version: 'v2',
      settings: {
        successMessage: 'Row approved',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { model, state, message } = createActionModel<JSRecordActionModel>({
      ModelClass: JSRecordActionModel,
      use: 'JSRecordActionModel',
      uid: 'js-record-action-run',
    });
    model.context.defineProperty('record', {
      value: {
        id: 7,
        name: 'Ada',
        status: 'pending',
      },
    });
    model.context.defineProperty('filterByTk', {
      value: 7,
    });

    await model.applyFlow('clickSettings');

    expect(state.recordName).toBe('Ada');
    expect(state.filterByTk).toBe(7);
    expect(message.success).toHaveBeenCalledWith('Row approved:7');
    expect(model.props.loading).toBe(false);
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding: JS_ACTION_SOURCE_BINDING,
        context: expect.objectContaining({
          ownerKind: 'flowModel.actionSettings',
          ownerLocator: expect.objectContaining({
            use: 'JSRecordActionModel',
          }),
        }),
      }),
    );
  });
});
