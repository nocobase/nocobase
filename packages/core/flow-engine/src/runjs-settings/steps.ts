/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  applyDefaults,
  activeFieldKeysForStep,
  mergeActiveValuesPreserveInactiveUnknown,
  pickRunJSSettingsSchemaFields,
} from './values';
import { runtimeSettingsRegistry } from './registry';
import { toFlowUISchema } from './toFlowUISchema';
import type { RunJSSettingsJSONValue, RunJSSettingsModelLike, RunJSSettingsSchema } from './types';
import type { ParamObject, StepDefinition } from '../types';

export const RUNJS_SETTINGS_FLOW_KEY = 'runjsSettings';
export const RUNJS_SETTINGS_CONFIGURE_STEP_KEY = 'configure';

type FlowLike = {
  key: string;
  title?: string;
  sort?: number;
  steps: Record<string, StepDefinition>;
  options?: Record<string, unknown>;
};

function getConfigureValues(model: RunJSSettingsModelLike): Record<string, RunJSSettingsJSONValue> {
  const values = model.getStepParams?.(RUNJS_SETTINGS_FLOW_KEY, RUNJS_SETTINGS_CONFIGURE_STEP_KEY);
  return values && typeof values === 'object' && !Array.isArray(values)
    ? (values as Record<string, RunJSSettingsJSONValue>)
    : {};
}

function hasSettingsSteps(schema: RunJSSettingsSchema | undefined): schema is RunJSSettingsSchema {
  return !!schema?.steps && Object.keys(schema.steps).length > 0;
}

function getOrderedStepKeys(schema: RunJSSettingsSchema): string[] {
  const ordered = schema.stepOrder?.filter((key) => schema.steps?.[key]) || Object.keys(schema.steps || {});
  const rest = Object.keys(schema.steps || {}).filter((key) => !ordered.includes(key));
  return [...ordered, ...rest];
}

function evaluateSettingsSchema(
  model: RunJSSettingsModelLike,
  phase: 'settings-open' | 'settings-draft' | 'settings-save',
  values: Record<string, RunJSSettingsJSONValue>,
  draftValues?: Record<string, RunJSSettingsJSONValue>,
) {
  return runtimeSettingsRegistry.evaluate(model, 'default', {
    phase,
    values,
    draftValues,
  });
}

export function buildRunJSSettingsStepDefinitions(
  model: RunJSSettingsModelLike,
): Record<string, StepDefinition> | null {
  const entry = runtimeSettingsRegistry.get(model, 'default');
  if (!entry) {
    return null;
  }

  const values = getConfigureValues(model);
  const result = evaluateSettingsSchema(model, 'settings-open', values);
  if (!hasSettingsSteps(result.schema)) {
    return null;
  }

  const steps: Record<string, StepDefinition> = {};
  getOrderedStepKeys(result.schema).forEach((settingsStepKey, index) => {
    const settingsStep = result.schema.steps?.[settingsStepKey];
    if (!settingsStep) {
      return;
    }
    const fieldKeys = activeFieldKeysForStep(result.schema, settingsStepKey);
    if (fieldKeys.length === 0) {
      return;
    }

    steps[settingsStepKey] = {
      key: settingsStepKey,
      title: settingsStep.title || settingsStepKey,
      sort: index + 1,
      useRawParams: true,
      refreshUiSchemaOnValuesChange: { debounceMs: 150 },
      settingsParams: {
        flowKey: RUNJS_SETTINGS_FLOW_KEY,
        stepKey: RUNJS_SETTINGS_CONFIGURE_STEP_KEY,
      },
      defaultParams(ctx) {
        const currentValues = getConfigureValues(ctx.model);
        const evaluated = evaluateSettingsSchema(ctx.model, 'settings-open', currentValues);
        if (!evaluated.schema) {
          return {};
        }
        return applyDefaults(
          pickRunJSSettingsSchemaFields(evaluated.schema, activeFieldKeysForStep(evaluated.schema, settingsStepKey)),
          currentValues,
        );
      },
      uiSchema(ctx) {
        const currentValues = getConfigureValues(ctx.model);
        const draftValues = ctx.getDraftStepParams(RUNJS_SETTINGS_FLOW_KEY, RUNJS_SETTINGS_CONFIGURE_STEP_KEY);
        const evaluated = evaluateSettingsSchema(
          ctx.model,
          draftValues ? 'settings-draft' : 'settings-open',
          {
            ...currentValues,
          },
          draftValues,
        );
        const errorSchema = evaluated.error
          ? {
              __runjsSettingsError: {
                type: 'void',
                'x-component': 'Alert',
                'x-component-props': {
                  type: evaluated.schema ? 'warning' : 'error',
                  showIcon: true,
                  message: ctx.t('Invalid JS block settings'),
                  description: evaluated.error.message,
                },
              },
            }
          : {};
        if (!evaluated.schema) {
          return errorSchema;
        }
        return {
          ...errorSchema,
          ...toFlowUISchema(evaluated.schema, {
            fieldKeys: activeFieldKeysForStep(evaluated.schema, settingsStepKey),
          }),
        };
      },
      beforeParamsSave({ ctx, currentParams, previousParams }): ParamObject {
        const evaluated = evaluateSettingsSchema(ctx.model, 'settings-save', previousParams || {}, currentParams || {});
        if (evaluated.error || !evaluated.schema) {
          throw evaluated.error || new Error(ctx.t('Invalid JS block settings'));
        }
        const fieldKeys = activeFieldKeysForStep(evaluated.schema, settingsStepKey);
        return mergeActiveValuesPreserveInactiveUnknown({
          schema: pickRunJSSettingsSchemaFields(evaluated.schema, fieldKeys),
          previousParams,
          draftParams: currentParams,
        }) as ParamObject;
      },
      async afterParamsSave({ ctx }) {
        ctx.model.invalidateFlowCache('beforeRender', true);
        await ctx.model.rerender();
      },
    };
  });

  return Object.keys(steps).length ? steps : null;
}

export function resolveRunJSSettingsFlow(model: RunJSSettingsModelLike, flow: FlowLike): FlowLike {
  if (flow?.key !== RUNJS_SETTINGS_FLOW_KEY) {
    return flow;
  }
  const steps = buildRunJSSettingsStepDefinitions(model);
  if (!steps) {
    return flow;
  }
  return {
    key: flow.key,
    title: flow.title,
    sort: flow.sort,
    options: flow.options || {},
    steps,
  };
}
