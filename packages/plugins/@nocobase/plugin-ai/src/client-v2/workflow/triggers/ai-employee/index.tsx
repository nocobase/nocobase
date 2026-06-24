/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Trigger } from '@nocobase/plugin-workflow/client-v2';
import { tExpr } from '../../../locale';
import { TRIGGER_PARAMETER_NAME_PATTERN, TRIGGER_PARAMETER_TYPES } from '../../constants';
import type { AIEmployeeTriggerConfig, AIEmployeeTriggerParameter, TriggerParameterType } from '../../types';

export default class AIEmployeeTrigger extends Trigger {
  sync = true;
  title = tExpr('AI employee event');
  description = tExpr('Triggered by AI employees through tool calling.');
  FieldsetLoader = () => import('./AIEmployeeTriggerConfig').then((m) => ({ default: m.AIEmployeeTriggerConfig }));

  createDefaultConfig(): AIEmployeeTriggerConfig {
    return {
      parameters: [],
    };
  }

  validate(config: Record<string, unknown>): boolean {
    const parameters = config.parameters;
    if (parameters === undefined) {
      return true;
    }
    return Array.isArray(parameters) && parameters.every(isValidParameter);
  }

  useVariables(config: AIEmployeeTriggerConfig) {
    return (
      config.parameters?.map((item) => ({
        key: item.name,
        label: item.name,
        value: item.name,
      })) ?? []
    );
  }
}

function isValidParameter(value: unknown): value is AIEmployeeTriggerParameter {
  if (!isRecord(value)) {
    return false;
  }
  const type = value.type;
  if (!isTriggerParameterType(type)) {
    return false;
  }
  if (typeof value.name !== 'string' || !TRIGGER_PARAMETER_NAME_PATTERN.test(value.name)) {
    return false;
  }
  if (value.enumOptions !== undefined && !isStringArray(value.enumOptions)) {
    return false;
  }
  return typeof value.required === 'boolean' || value.required === undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTriggerParameterType(value: unknown): value is TriggerParameterType {
  return typeof value === 'string' && TRIGGER_PARAMETER_TYPES.includes(value as TriggerParameterType);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
