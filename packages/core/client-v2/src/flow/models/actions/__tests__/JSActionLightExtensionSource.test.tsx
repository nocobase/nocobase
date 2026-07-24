/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowExitAllException, FlowExitException, type FlowSettingsContext } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import { JSActionModel } from '../JSActionModel';
import { runJSActionRuntime } from '../jsActionLightExtensionRuntime';
import {
  createActionModel,
  createActionRunJsParams,
  JS_ACTION_SETTINGS_DESCRIPTOR,
  JS_ACTION_SOURCE_BINDING,
} from './jsActionLightExtensionTestUtils';

describe('JSActionModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('runs a light extension action through the runtime resolver and only toggles the current action loading', async () => {
    const resolve = vi.fn(() => ({
      code: `
ctx.__testState.loadingDuringRun = ctx.model.props.loading;
ctx.__testState.peerLoadingDuringRun = ctx.__peerAction.props.loading === true;
ctx.message.success(ctx.settings.successMessage + ':' + ctx.runJsSource.context.lightExtension.entryId);
      `,
      version: 'v2',
      settings: {
        successMessage: 'Approved',
      },
      context: {
        lightExtension: {
          entryId: 'entry_mark_approved',
          entryPath: 'src/client/js-actions/mark-approved/index.ts',
        },
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { engine, model, state, message } = createActionModel<JSActionModel>({
      ModelClass: JSActionModel,
      use: 'JSActionModel',
      uid: 'js-action-run',
    });
    const peerAction = engine.createModel<JSActionModel>({
      use: 'JSActionModel',
      uid: 'js-action-peer',
      props: {
        loading: false,
      },
      stepParams: {
        clickSettings: {
          runJs: createActionRunJsParams(),
        },
      },
    });
    model.context.defineProperty('__peerAction', {
      value: peerAction,
    });

    await model.applyFlow('clickSettings');

    expect(state.loadingDuringRun).toBe(true);
    expect(state.peerLoadingDuringRun).toBe(false);
    expect(model.props.loading).toBe(false);
    expect(peerAction.props.loading).toBe(false);
    expect(message.success).toHaveBeenCalledWith('Approved:entry_mark_approved');
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: JS_ACTION_SOURCE_BINDING,
        settings: {
          successMessage: 'Approved',
        },
        context: expect.objectContaining({
          modelUid: model.uid,
          ownerKind: 'flowModel.actionSettings',
          ownerLocator: expect.objectContaining({
            kind: 'flowModel.actionSettings',
            modelUid: model.uid,
            use: 'JSActionModel',
          }),
        }),
      }),
    );
  });

  it('settles the current action loading after overlapping programmatic runs', async () => {
    let resolveFirstRun: (() => void) | undefined;
    const firstRunReady = new Promise<void>((resolve) => {
      resolveFirstRun = resolve;
    });
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: vi.fn(async () => {
        await firstRunReady;
        return {
          code: '',
          version: 'v2',
        };
      }),
    });
    const { model } = createActionModel<JSActionModel>({
      ModelClass: JSActionModel,
      use: 'JSActionModel',
      uid: 'js-action-overlap-loading',
    });

    const firstRun = runJSActionRuntime({
      ctx: model.context,
      params: createActionRunJsParams(),
      runJs: {
        code: '',
        version: 'v2',
      },
    });
    await Promise.resolve();
    expect(model.props.loading).toBe(true);
    const secondRun = runJSActionRuntime({
      ctx: model.context,
      params: createActionRunJsParams(),
      runJs: {
        code: '',
        version: 'v2',
      },
    });

    resolveFirstRun?.();
    await Promise.all([firstRun, secondRun]);

    expect(model.props.loading).toBe(false);
  });

  it('blocks JS Action settings values that violate schema constraints', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: vi.fn(async () => ({
        ...JS_ACTION_SETTINGS_DESCRIPTOR,
        settingsSchemaHash: 'schema_action_strict',
        schema: {
          type: 'object',
          properties: {
            successMessage: {
              type: 'string',
              title: 'Success message',
              minLength: 5,
            },
            contactEmail: {
              type: 'string',
              title: 'Contact email',
              format: 'email',
            },
            retryLimit: {
              type: 'number',
              title: 'Retry limit',
              minimum: 1,
              maximum: 3,
            },
            reviewerEmails: {
              type: 'array',
              title: 'Reviewer emails',
              items: {
                type: 'string',
                format: 'email',
              },
            },
          },
        },
      })),
      resolve: () => ({
        code: '',
      }),
    });
    const { model } = createActionModel<JSActionModel>({
      ModelClass: JSActionModel,
      use: 'JSActionModel',
      uid: 'js-action-settings-validation',
    });

    const steps = await model.getRuntimeFlowSettingSteps('clickSettings');
    const getStepByTitle = (title: string) => Object.values(steps || {}).find((step) => step.title === title);

    expect(
      () =>
        getStepByTitle('Success message')?.beforeParamsSave?.(model.context as FlowSettingsContext<JSActionModel>, {
          value: 'Bad',
        }),
    ).toThrow('Light extension settings validation failed.');
    expect(
      () =>
        getStepByTitle('Contact email')?.beforeParamsSave?.(model.context as FlowSettingsContext<JSActionModel>, {
          value: 'not-an-email',
        }),
    ).toThrow('Light extension settings validation failed.');
    expect(
      () =>
        getStepByTitle('Retry limit')?.beforeParamsSave?.(model.context as FlowSettingsContext<JSActionModel>, {
          value: 5,
        }),
    ).toThrow('Light extension settings validation failed.');
    expect(
      () =>
        getStepByTitle('Reviewer emails')?.beforeParamsSave?.(model.context as FlowSettingsContext<JSActionModel>, {
          value: ['reviewer@example.com', 'invalid'],
        }),
    ).toThrow('Light extension settings validation failed.');

    getStepByTitle('Contact email')?.beforeParamsSave?.(model.context as FlowSettingsContext<JSActionModel>, {
      value: 'owner@example.com',
    });
    expect(model.getStepParams('clickSettings', 'runJs')).toMatchObject({
      settings: {
        contactEmail: 'owner@example.com',
      },
    });
  });

  it('shows resolver failures without rejecting the click flow', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw Object.assign(new Error('entry missing'), {
          code: 'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
          status: 404,
        });
      },
    });
    const { model, message } = createActionModel<JSActionModel>({
      ModelClass: JSActionModel,
      use: 'JSActionModel',
      uid: 'js-action-error',
    });

    await expect(model.applyFlow('clickSettings')).resolves.toBeTruthy();

    expect(message.error).toHaveBeenCalledWith('entry missing');
    expect(model.props.loading).toBe(false);
  });

  it.each([
    new FlowExitException('clickSettings', 'js-action-exit'),
    new FlowExitAllException('clickSettings', 'js-action-exit'),
  ])('preserves %s as normal FlowExecutor control flow', async (exitError) => {
    const { model, message } = createActionModel<JSActionModel>({
      ModelClass: JSActionModel,
      use: 'JSActionModel',
      uid: 'js-action-exit',
      runJs: {
        code: 'ctx.exit();',
        version: 'v2',
        sourceMode: 'inline',
      },
    });
    vi.spyOn(model.context, 'runjs').mockRejectedValue(exitError);

    await expect(
      runJSActionRuntime({
        ctx: model.context,
        params: model.getStepParams('clickSettings', 'runJs') as Record<string, unknown>,
        runJs: {
          code: 'ctx.exit();',
          version: 'v2',
          sourceMode: 'inline',
        },
      }),
    ).rejects.toBe(exitError);

    expect(message.error).not.toHaveBeenCalled();
    expect(model.props.loading).toBe(false);
  });

  it('keeps ctx.exit() on the FlowExecutor normal-exit path', async () => {
    const { model, message } = createActionModel<JSActionModel>({
      ModelClass: JSActionModel,
      use: 'JSActionModel',
      uid: 'js-action-real-exit',
      runJs: {
        code: 'ctx.exit();',
        version: 'v2',
        sourceMode: 'inline',
      },
    });

    await expect(model.applyFlow('clickSettings')).resolves.toBeInstanceOf(FlowExitAllException);

    expect(message.error).not.toHaveBeenCalled();
    expect(model.props.loading).toBe(false);
  });
});
