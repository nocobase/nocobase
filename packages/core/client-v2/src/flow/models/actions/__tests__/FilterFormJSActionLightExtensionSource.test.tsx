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
import { FilterFormJSActionModel } from '../../blocks/filter-form/FilterFormJSActionModel';
import { createActionModel, JS_ACTION_SOURCE_BINDING } from './jsActionLightExtensionTestUtils';

describe('FilterFormJSActionModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves JS Action entries with filter form values', async () => {
    const resolve = vi.fn(() => ({
      code: `
const values = ctx.form.getFieldsValue();
ctx.__testState.filterStatus = values.status;
ctx.message.success(ctx.settings.successMessage + ':' + values.status);
      `,
      version: 'v2',
      settings: {
        successMessage: 'Filter read',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { model, state, message } = createActionModel<FilterFormJSActionModel>({
      ModelClass: FilterFormJSActionModel,
      use: 'FilterFormJSActionModel',
      uid: 'filter-form-js-action-run',
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue: () => ({
          status: 'pending',
        }),
      },
    });

    await model.applyFlow('clickSettings');

    expect(state.filterStatus).toBe('pending');
    expect(message.success).toHaveBeenCalledWith('Filter read:pending');
    expect(model.props.loading).toBe(false);
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding: JS_ACTION_SOURCE_BINDING,
        context: expect.objectContaining({
          ownerKind: 'flowModel.actionSettings',
          ownerLocator: expect.objectContaining({
            use: 'FilterFormJSActionModel',
          }),
        }),
      }),
    );
  });
});
