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
import type {
  RunJSSettingField,
  RunJSSettingsJSONValue,
  RunJSSettingsModelLike,
  RunJSSettingsSchema,
  UseSettingsInput,
} from './types';
import type { FlowSettingsAfterParamsSaveStructured, ParamObject, StepDefinition } from '../types';

export const RUNJS_SETTINGS_FLOW_KEY = 'runjsSettings';
export const RUNJS_SETTINGS_CONFIGURE_STEP_KEY = 'configure';

const RUNJS_CODE_PARAM_PATHS: Array<[flowKey: string, stepKey: string]> = [
  ['jsSettings', 'runJs'],
  ['clickSettings', 'runJs'],
];

type FlowLike = {
  key: string;
  title?: string;
  sort?: number;
  steps: Record<string, StepDefinition>;
  options?: Record<string, unknown>;
};

type RunJSSettingsAfterSave = FlowSettingsAfterParamsSaveStructured;

function getConfigureValues(model: RunJSSettingsModelLike): Record<string, RunJSSettingsJSONValue> {
  const values = model.getStepParams?.(RUNJS_SETTINGS_FLOW_KEY, RUNJS_SETTINGS_CONFIGURE_STEP_KEY);
  return values && typeof values === 'object' && !Array.isArray(values)
    ? (values as Record<string, RunJSSettingsJSONValue>)
    : {};
}

function getRunJSCode(model: RunJSSettingsModelLike): string | undefined {
  for (const [flowKey, stepKey] of RUNJS_CODE_PARAM_PATHS) {
    const params = model.getStepParams?.(flowKey, stepKey);
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const code = (params as { code?: unknown }).code;
      if (typeof code === 'string' && code.trim()) {
        return code;
      }
    }
  }
  return undefined;
}

function findCallArgumentStart(code: string, callIndex: number): number {
  const openParenIndex = code.indexOf('(', callIndex);
  if (openParenIndex < 0) {
    return -1;
  }
  let index = openParenIndex + 1;
  while (index < code.length && /\s/.test(code[index])) {
    index += 1;
  }
  return code[index] === '{' ? index : -1;
}

function readBalancedObjectLiteral(code: string, startIndex: number): string | undefined {
  let depth = 0;
  let quote: '"' | "'" | '`' | undefined;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = startIndex; index < code.length; index += 1) {
    const char = code[index];
    const nextChar = code[index + 1];

    if (lineComment) {
      if (char === '\n') {
        lineComment = false;
      }
      continue;
    }
    if (blockComment) {
      if (char === '*' && nextChar === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '/' && nextChar === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && nextChar === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return code.slice(startIndex, index + 1);
      }
    }
  }
  return undefined;
}

function evaluateDirectSchemaLiteral(literal: string): unknown | undefined {
  if (/\.\.\./.test(literal) || /=>/.test(literal) || /\bfunction\b/.test(literal) || /\bnew\s+/.test(literal)) {
    return undefined;
  }
  try {
    return Function(`"use strict"; return (${literal});`)();
  } catch {
    return undefined;
  }
}

export function extractRunJSSettingsSchemaFromCode(code: string): unknown | undefined {
  let searchIndex = 0;
  while (searchIndex < code.length) {
    const callIndex = code.indexOf('ctx.useSettings', searchIndex);
    if (callIndex < 0) {
      return undefined;
    }
    const argumentStart = findCallArgumentStart(code, callIndex);
    if (argumentStart >= 0) {
      const literal = readBalancedObjectLiteral(code, argumentStart);
      if (literal) {
        const schema = evaluateDirectSchemaLiteral(literal);
        if (schema) {
          return schema;
        }
      }
    }
    searchIndex = callIndex + 'ctx.useSettings'.length;
  }
  return undefined;
}

function discoverRunJSSettingsSchema(model: RunJSSettingsModelLike): void {
  const code = getRunJSCode(model);
  if (!code) {
    return;
  }
  const schema = extractRunJSSettingsSchemaFromCode(code);
  if (!schema) {
    return;
  }
  const run = runtimeSettingsRegistry.beginRun(model, code);
  runtimeSettingsRegistry.register(model, 'default', schema as UseSettingsInput, run);
}

export function hasRunJSSettingsConfigItems(schema: RunJSSettingsSchema | undefined): schema is RunJSSettingsSchema {
  return isDirectRunJSSettingsSchema(schema) && activeFieldKeys(schema).length > 0;
}

export function createRunJSSettingsConfigureStep(options: { afterParamsSave?: RunJSSettingsAfterSave } = {}) {
  return {
    title: 'Configure',
    useRawParams: true,
    refreshUiSchemaOnValuesChange: { debounceMs: 150 },
    hideInSettings(ctx) {
      const values = ctx.model.getStepParams(RUNJS_SETTINGS_FLOW_KEY, RUNJS_SETTINGS_CONFIGURE_STEP_KEY) || {};
      const result = evaluateSettingsSchema(ctx.model, 'settings-open', values);
      return hasRunJSSettingsConfigItems(result.schema);
    },
    defaultParams(ctx) {
      const values = ctx.getStepParams(RUNJS_SETTINGS_CONFIGURE_STEP_KEY) || {};
      const result = evaluateSettingsSchema(ctx.model, 'settings-open', values);
      return result.schema ? applyDefaults(result.schema, values) : {};
    },
    uiSchema(ctx) {
      const values = ctx.getStepParams(RUNJS_SETTINGS_CONFIGURE_STEP_KEY) || {};
      const draftValues = ctx.getDraftStepParams(RUNJS_SETTINGS_FLOW_KEY, RUNJS_SETTINGS_CONFIGURE_STEP_KEY);
      const result = evaluateSettingsSchema(
        ctx.model,
        draftValues ? 'settings-draft' : 'settings-open',
        values,
        draftValues,
      );
      const errorSchema = result.error
        ? {
            __runjsSettingsError: {
              type: 'void',
              'x-component': 'Alert',
              'x-component-props': {
                type: result.schema ? 'warning' : 'error',
                showIcon: true,
                message: ctx.t('Invalid JS block settings'),
                description: result.error.message,
              },
            },
          }
        : {};
      return {
        ...errorSchema,
        ...(result.schema ? toFlowUISchema(result.schema) : {}),
      };
    },
    beforeParamsSave({ ctx, currentParams, previousParams }): ParamObject {
      const result = evaluateSettingsSchema(ctx.model, 'settings-save', previousParams || {}, currentParams || {});
      if (result.error || !result.schema) {
        throw result.error || new Error(ctx.t('Invalid JS block settings'));
      }
      return mergeActiveValuesPreserveInactiveUnknown({
        schema: result.schema,
        previousParams,
        draftParams: currentParams,
      }) as ParamObject;
    },
    async afterParamsSave(args) {
      if (options.afterParamsSave) {
        await options.afterParamsSave(args);
        return;
      }
      args.ctx.model.invalidateFlowCache('beforeRender', true);
      await args.ctx.model.rerender();
    },
  } satisfies StepDefinition;
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
  let entry = runtimeSettingsRegistry.get(model, 'default');
  if (!entry) {
    discoverRunJSSettingsSchema(model);
    entry = runtimeSettingsRegistry.get(model, 'default');
  }
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
