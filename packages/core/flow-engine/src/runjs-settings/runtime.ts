/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DataSourceManager } from '../data-source';
import type { FlowRunJSContext } from '../flowContext';
import { applyDefaults } from './values';
import { runtimeSettingsRegistry } from './registry';
import { resolveRunJSSettingsConfigValue } from './resolveConfig';
import type { RunJSSettingsJSONValue, RunJSSettingsKey, UseSettingsInput, UseSettingsOptions } from './types';

function getConfigureValues(ctx: FlowRunJSContext): Record<string, RunJSSettingsJSONValue> {
  const values = ctx.model?.getStepParams?.('runjsSettings', 'configure');
  return values && typeof values === 'object' && !Array.isArray(values)
    ? (values as Record<string, RunJSSettingsJSONValue>)
    : {};
}

export function useRunJSSettings(
  ctx: FlowRunJSContext,
  schemaOrFactory: UseSettingsInput,
  options: UseSettingsOptions = {},
): Record<string, RunJSSettingsJSONValue> {
  const settingsKey: RunJSSettingsKey = options.key || 'default';
  if (settingsKey !== 'default') {
    console.warn(`ctx.useSettings only supports the 'default' settings group in MVP`);
    return {};
  }
  const model = ctx.model;
  const run = runtimeSettingsRegistry.ensureRun(model);
  runtimeSettingsRegistry.register(model, settingsKey, schemaOrFactory, run);
  const values = getConfigureValues(ctx);
  const result = runtimeSettingsRegistry.evaluate(model, settingsKey, {
    phase: 'render',
    values,
  });
  if (result.error || !result.schema) {
    runtimeSettingsRegistry.registerError(
      model,
      settingsKey,
      result.error || new Error('Invalid settings schema'),
      run,
    );
    return {};
  }
  return applyDefaults(result.schema, values);
}

export function resolveRunJSConfig(ctx: FlowRunJSContext, name: string): unknown {
  const config = (ctx.config || {}) as Record<string, RunJSSettingsJSONValue>;
  const value = config[name];
  return resolveRunJSSettingsConfigValue(ctx.dataSourceManager as DataSourceManager | undefined, value);
}
