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
  activeFieldKeys,
  activeFieldKeysForItem,
  isPlainRecord,
  mergeActiveValuesPreserveInactiveUnknown,
  pickRunJSSettingsSchemaFields,
} from './values';
import { isDirectRunJSSettingsSchema } from './normalize';
import { runtimeSettingsRegistry } from './registry';
import { toFlowUISchema } from './toFlowUISchema';
import type { RunJSSettingField, RunJSSettingsJSONValue, RunJSSettingsModelLike, RunJSSettingsSchema } from './types';
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

export function hasRunJSSettingsConfigItems(schema: RunJSSettingsSchema | undefined): schema is RunJSSettingsSchema {
  return isDirectRunJSSettingsSchema(schema) && activeFieldKeys(schema).length > 0;
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

function isObjectField(field: RunJSSettingField | undefined): field is RunJSSettingField {
  return field?.type === 'object';
}

function getObjectItemValues(
  values: Record<string, unknown>,
  settingsItemKey: string,
): Record<string, RunJSSettingsJSONValue> {
  const itemValues = values[settingsItemKey];
  return isPlainRecord(itemValues) ? (itemValues as Record<string, RunJSSettingsJSONValue>) : {};
}

function getSettingsItemSchema(schema: RunJSSettingsSchema, settingsItemKey: string): RunJSSettingsSchema {
  const field = schema.fields[settingsItemKey];
  if (isObjectField(field)) {
    return {
      version: schema.version,
      fields: field.properties || {},
      order: Object.keys(field.properties || {}),
    };
  }
  return pickRunJSSettingsSchemaFields(schema, activeFieldKeysForItem(schema, settingsItemKey));
}

function getDraftValuesForEvaluate(
  field: RunJSSettingField | undefined,
  settingsItemKey: string,
  currentValues: Record<string, RunJSSettingsJSONValue>,
  draftValues: Record<string, RunJSSettingsJSONValue> | undefined,
): Record<string, RunJSSettingsJSONValue> | undefined {
  if (!draftValues) {
    return undefined;
  }
  if (!isObjectField(field)) {
    return draftValues;
  }
  return {
    ...currentValues,
    [settingsItemKey]: draftValues,
  };
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
  if (!hasRunJSSettingsConfigItems(result.schema)) {
    return null;
  }

  const steps: Record<string, StepDefinition> = {};
  activeFieldKeys(result.schema).forEach((settingsItemKey, index) => {
    const settingsField = result.schema.fields[settingsItemKey];
    const fieldKeys = activeFieldKeysForItem(result.schema, settingsItemKey);
    if (fieldKeys.length === 0) {
      return;
    }

    steps[settingsItemKey] = {
      key: settingsItemKey,
      title: settingsField.title || settingsItemKey,
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
        const field = evaluated.schema.fields[settingsItemKey];
        const stepSchema = getSettingsItemSchema(evaluated.schema, settingsItemKey);
        return applyDefaults(
          stepSchema,
          isObjectField(field) ? getObjectItemValues(currentValues, settingsItemKey) : currentValues,
        );
      },
      uiSchema(ctx) {
        const currentValues = getConfigureValues(ctx.model);
        const draftValues = ctx.getDraftStepParams(RUNJS_SETTINGS_FLOW_KEY, RUNJS_SETTINGS_CONFIGURE_STEP_KEY);
        const draftValuesForEvaluate = getDraftValuesForEvaluate(
          settingsField,
          settingsItemKey,
          currentValues,
          draftValues,
        );
        const evaluated = evaluateSettingsSchema(
          ctx.model,
          draftValuesForEvaluate ? 'settings-draft' : 'settings-open',
          {
            ...currentValues,
          },
          draftValuesForEvaluate,
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
        const stepSchema = getSettingsItemSchema(evaluated.schema, settingsItemKey);
        return {
          ...errorSchema,
          ...toFlowUISchema(stepSchema),
        };
      },
      beforeParamsSave({ ctx, currentParams, previousParams }): ParamObject {
        const draftValuesForEvaluate = getDraftValuesForEvaluate(
          settingsField,
          settingsItemKey,
          previousParams || {},
          currentParams || {},
        );
        const evaluated = evaluateSettingsSchema(
          ctx.model,
          'settings-save',
          previousParams || {},
          draftValuesForEvaluate || currentParams || {},
        );
        if (evaluated.error || !evaluated.schema) {
          throw evaluated.error || new Error(ctx.t('Invalid JS block settings'));
        }
        const field = evaluated.schema.fields[settingsItemKey];
        if (isObjectField(field)) {
          const savedItem = mergeActiveValuesPreserveInactiveUnknown({
            schema: getSettingsItemSchema(evaluated.schema, settingsItemKey),
            previousParams: getObjectItemValues(previousParams || {}, settingsItemKey),
            draftParams: currentParams,
          });
          return mergeActiveValuesPreserveInactiveUnknown({
            schema: pickRunJSSettingsSchemaFields(
              evaluated.schema,
              activeFieldKeysForItem(evaluated.schema, settingsItemKey),
            ),
            previousParams,
            draftParams: { [settingsItemKey]: savedItem },
          }) as ParamObject;
        }
        return mergeActiveValuesPreserveInactiveUnknown({
          schema: getSettingsItemSchema(evaluated.schema, settingsItemKey),
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
