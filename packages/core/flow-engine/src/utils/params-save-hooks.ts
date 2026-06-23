/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSettingsContext } from '../flowContext';
import type {
  FlowSettingsAfterParamsSave,
  FlowSettingsAfterParamsSaveArgs,
  FlowSettingsAfterParamsSaveLegacy,
  FlowSettingsAfterParamsSaveStructured,
  FlowSettingsBeforeParamsSave,
  FlowSettingsBeforeParamsSaveArgs,
  FlowSettingsBeforeParamsSaveLegacy,
  FlowSettingsBeforeParamsSaveStructured,
  ParamObject,
} from '../types';
import type { FlowModel } from '../models';

type FlowSettingsHookArgs = FlowSettingsBeforeParamsSaveArgs | FlowSettingsAfterParamsSaveArgs;
type StepParamsWriter = Pick<FlowModel, 'setStepParams'>;

async function withStructuredHookArgs<TResult>(
  args: FlowSettingsHookArgs,
  runner: (ctx: FlowSettingsContext<FlowModel>) => Promise<TResult> | TResult,
): Promise<TResult> {
  const ctx = args.ctx as FlowSettingsContext<FlowModel>;
  const target = ctx as unknown as Record<string, unknown>;
  const descriptors = new Map<string, PropertyDescriptor | undefined>();
  Object.entries(args).forEach(([key, value]) => {
    descriptors.set(key, Object.getOwnPropertyDescriptor(target, key));
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: false,
      value,
      writable: true,
    });
  });
  try {
    return await runner(ctx);
  } finally {
    descriptors.forEach((descriptor, key) => {
      if (descriptor) {
        Object.defineProperty(target, key, descriptor);
      } else {
        delete target[key];
      }
    });
  }
}

export async function callBeforeParamsSaveHook<TModel extends FlowModel>(
  hook: FlowSettingsBeforeParamsSave<TModel>,
  args: FlowSettingsBeforeParamsSaveArgs<TModel>,
): Promise<ParamObject | void> {
  return withStructuredHookArgs(args, (ctx) =>
    (hook as FlowSettingsBeforeParamsSaveStructured<TModel> & FlowSettingsBeforeParamsSaveLegacy<TModel>)(
      ctx as FlowSettingsContext<TModel> & FlowSettingsBeforeParamsSaveArgs<TModel>,
      args.currentParams,
      args.previousParams,
    ),
  );
}

export async function callAfterParamsSaveHook<TModel extends FlowModel>(
  hook: FlowSettingsAfterParamsSave<TModel>,
  args: FlowSettingsAfterParamsSaveArgs<TModel>,
): Promise<void> {
  await withStructuredHookArgs(args, (ctx) =>
    (hook as FlowSettingsAfterParamsSaveStructured<TModel> & FlowSettingsAfterParamsSaveLegacy<TModel>)(
      ctx as FlowSettingsContext<TModel> & FlowSettingsAfterParamsSaveArgs<TModel>,
      args.savedParams,
      args.previousParams,
    ),
  );
}

export function replaceStepParams(
  model: StepParamsWriter,
  flowKey: string,
  stepKey: string,
  params: ParamObject,
): void {
  model.setStepParams(flowKey, { [stepKey]: params });
}
