/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const RUNJS_SETTINGS_CONDITION_OPERATORS = ['$eq', '$ne', '$in', '$notIn', '$empty', '$notEmpty'] as const;
export const RUNJS_SETTINGS_CONDITION_LOGICS = ['$and', '$or'] as const;

export type RunJSSettingsConditionOperator = (typeof RUNJS_SETTINGS_CONDITION_OPERATORS)[number];
export type RunJSSettingsConditionLogic = (typeof RUNJS_SETTINGS_CONDITION_LOGICS)[number];

export type RunJSSettingsCondition =
  | {
      path: string;
      operator: '$eq' | '$ne' | '$in' | '$notIn';
      value: unknown;
    }
  | {
      path: string;
      operator: '$empty' | '$notEmpty';
    }
  | {
      logic: RunJSSettingsConditionLogic;
      items: RunJSSettingsCondition[];
    };

export interface RunJSSettingsConditionInput {
  defaults?: unknown;
  settings?: unknown;
}

export class RunJSSettingsConditionError extends Error {
  readonly code = 'RUNJS_SETTINGS_CONDITION_INVALID';

  constructor(message: string) {
    super(message);
    this.name = 'RunJSSettingsConditionError';
  }
}

export function evaluateSettingsCondition(
  condition: RunJSSettingsCondition,
  input: RunJSSettingsConditionInput,
): boolean {
  const settings = mergeSettingsValues(input.defaults, input.settings);
  return evaluateConditionNode(condition, settings);
}

export function getSettingsValueAtPath(settings: unknown, path: string): unknown {
  if (typeof path !== 'string' || !path) {
    throw new RunJSSettingsConditionError('Settings condition path must be a non-empty string');
  }

  let current = settings;
  for (const segment of path.split('.')) {
    if (!segment || isUnsafePathSegment(segment)) {
      throw new RunJSSettingsConditionError(`Settings condition path segment "${segment}" is not allowed`);
    }
    if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

export function isSettingsFieldVisible(
  condition: RunJSSettingsCondition | undefined,
  input: RunJSSettingsConditionInput,
): boolean {
  return typeof condition === 'undefined' || evaluateSettingsCondition(condition, input);
}

function evaluateConditionNode(condition: RunJSSettingsCondition, settings: unknown): boolean {
  if (!isRecord(condition)) {
    throw new RunJSSettingsConditionError('Settings condition must be an object');
  }

  if ('logic' in condition) {
    if (!RUNJS_SETTINGS_CONDITION_LOGICS.includes(condition.logic as RunJSSettingsConditionLogic)) {
      throw new RunJSSettingsConditionError(`Settings condition logic "${String(condition.logic)}" is not supported`);
    }
    if (!Array.isArray(condition.items)) {
      throw new RunJSSettingsConditionError('Settings condition group items must be an array');
    }
    return condition.logic === '$and'
      ? condition.items.every((item) => evaluateConditionNode(item, settings))
      : condition.items.some((item) => evaluateConditionNode(item, settings));
  }

  if (typeof condition.path !== 'string' || typeof condition.operator !== 'string') {
    throw new RunJSSettingsConditionError('Settings condition leaf must contain path and operator');
  }
  if (!RUNJS_SETTINGS_CONDITION_OPERATORS.includes(condition.operator as RunJSSettingsConditionOperator)) {
    throw new RunJSSettingsConditionError(`Settings condition operator "${condition.operator}" is not supported`);
  }

  const current = getSettingsValueAtPath(settings, condition.path);
  switch (condition.operator) {
    case '$eq':
      return strictJsonEqual(current, condition.value);
    case '$ne':
      return !strictJsonEqual(current, condition.value);
    case '$in':
      if (!Array.isArray(condition.value)) {
        throw new RunJSSettingsConditionError('$in condition value must be an array');
      }
      return condition.value.some((item) => strictJsonEqual(current, item));
    case '$notIn':
      if (!Array.isArray(condition.value)) {
        throw new RunJSSettingsConditionError('$notIn condition value must be an array');
      }
      return condition.value.every((item) => !strictJsonEqual(current, item));
    case '$empty':
      return isEmptySettingsValue(current);
    case '$notEmpty':
      return !isEmptySettingsValue(current);
  }
}

function mergeSettingsValues(defaults: unknown, settings: unknown): unknown {
  if (!isRecord(defaults) || !isRecord(settings)) {
    return typeof settings === 'undefined' ? defaults : settings;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (!isUnsafePathSegment(key)) {
      result[key] = value;
    }
  }
  for (const [key, value] of Object.entries(settings)) {
    if (!isUnsafePathSegment(key)) {
      result[key] = mergeSettingsValues(result[key], value);
    }
  }
  return result;
}

function strictJsonEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => strictJsonEqual(item, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && strictJsonEqual(left[key], right[key]))
  );
}

function isEmptySettingsValue(value: unknown): boolean {
  return (
    typeof value === 'undefined' ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (isRecord(value) && Object.keys(value).length === 0)
  );
}

function isUnsafePathSegment(segment: string): boolean {
  return segment === '__proto__' || segment === 'prototype' || segment === 'constructor';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
