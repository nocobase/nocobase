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
import { JSFormActionModel } from '../../blocks/form/JSFormActionModel';
import { createActionModel, JS_ACTION_SOURCE_BINDING } from './jsActionLightExtensionTestUtils';

describe('JSFormActionModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves JS Action publications with form values and refresh method', async () => {
    const resolve = vi.fn(() => ({
      code: `
const values = ctx.form.getFieldsValue();
ctx.__testState.formStatus = values.status;
await ctx.refresh();
ctx.message.success(ctx.settings.successMessage + ':' + values.amount);
      `,
      version: 'v2',
      settings: {
        successMessage: 'Form approved',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { model, state, message } = createActionModel<JSFormActionModel>({
      ModelClass: JSFormActionModel,
      use: 'JSFormActionModel',
      uid: 'js-form-action-run',
    });
    const refresh = vi.fn(async () => {
      state.refreshed = true;
    });
    model.context.defineProperty('form', {
      value: {
        getFieldsValue: () => ({
          status: 'pending',
          amount: 30,
        }),
      },
    });
    model.context.defineProperty('blockModel', {
      value: {
        resource: {
          refresh,
        },
      },
    });

    await model.applyFlow('clickSettings');

    expect(state.formStatus).toBe('pending');
    expect(state.refreshed).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(message.success).toHaveBeenCalledWith('Form approved:30');
    expect(model.props.loading).toBe(false);
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding: JS_ACTION_SOURCE_BINDING,
        context: expect.objectContaining({
          ownerKind: 'flowModel.actionSettings',
          ownerLocator: expect.objectContaining({
            use: 'JSFormActionModel',
          }),
        }),
      }),
    );
  });
});
