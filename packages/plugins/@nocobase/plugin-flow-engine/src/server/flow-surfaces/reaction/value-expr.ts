/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import { FLOW_SURFACE_REACTION_INVALID_CONDITION_PATH } from './errors';
import type { FlowSurfaceReactionFilter, FlowSurfaceValueExpr } from './types';
import { extractPropertyPath, formatPathToVariable, isVariableExpression, normalizeRunJSValue } from './utils';

const EMPTY_CONDITION = Object.freeze({ logic: '$and', items: [] });

function normalizeBarePath(path: unknown, label: string) {
  if (typeof path === 'string' && isVariableExpression(path)) {
    const extracted = extractPropertyPath(path);
    if (Array.isArray(extracted)) {
      return extracted.join('.');
    }
  }

  const normalized = String(path ?? '')
    .trim()
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('.');
  if (!normalized) {
    throwBadRequest(`flowSurfaces reaction ${label} cannot be empty`, FLOW_SURFACE_REACTION_INVALID_CONDITION_PATH);
  }
  return normalized;
}

export function barePathToVariableExpression(path: unknown, label = 'path') {
  const normalized = normalizeBarePath(path, label);
  return formatPathToVariable(
    normalized
      .split('.')
      .map((segment) => segment.trim())
      .filter(Boolean),
  );
}

export function normalizeReactionValueExpr(input: any): FlowSurfaceValueExpr {
  if (!_.isPlainObject(input) || !Object.prototype.hasOwnProperty.call(input, 'source')) {
    if (typeof input === 'string' && isVariableExpression(input)) {
      return {
        source: 'path',
        path: normalizeBarePath(input, 'value.path'),
      };
    }
    if (_.isPlainObject(input) && Object.prototype.hasOwnProperty.call(input, 'code')) {
      const normalizedRunjs = normalizeRunJSValue({
        code: String(input.code ?? ''),
        version: input.version == null ? undefined : String(input.version),
      });
      return {
        source: 'runjs',
        code: normalizedRunjs.code,
        version: normalizedRunjs.version as 'v1' | 'v2',
      };
    }
    return {
      source: 'literal',
      value: _.cloneDeep(input),
    };
  }

  const source = String(input.source || '').trim();
  if (source === 'literal') {
    return {
      source: 'literal',
      value: _.cloneDeep(input.value),
    };
  }
  if (source === 'path') {
    return {
      source: 'path',
      path: normalizeBarePath(input.path, 'value.path'),
    };
  }
  if (source === 'runjs') {
    const normalizedRunjs = normalizeRunJSValue({
      code: String(input.code ?? ''),
      version: input.version == null ? undefined : String(input.version),
    });
    return {
      source: 'runjs',
      code: normalizedRunjs.code,
      version: normalizedRunjs.version as 'v1' | 'v2',
    };
  }

  throwBadRequest(`flowSurfaces reaction value.source '${source}' is unsupported`);
}

export function compileReactionValueExpr(input: FlowSurfaceValueExpr | any): any {
  const normalized = normalizeReactionValueExpr(input);
  if (normalized.source === 'literal') {
    return _.cloneDeep(normalized.value);
  }
  if (normalized.source === 'path') {
    return barePathToVariableExpression(normalized.path, 'value.path');
  }
  const normalizedRunjs = normalizeRunJSValue({
    code: normalized.code,
    version: normalized.version,
  });
  return {
    code: normalizedRunjs.code,
    version: normalizedRunjs.version,
  };
}

function compileConditionNode(input: any): any {
  if (Array.isArray(input)) {
    return input.map((item) => compileConditionNode(item));
  }

  if (_.isPlainObject(input)) {
    if (Object.prototype.hasOwnProperty.call(input, 'source')) {
      return compileReactionValueExpr(input);
    }

    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === 'path') {
        output[key] = barePathToVariableExpression(value, 'condition.path');
        continue;
      }
      if (key === 'value') {
        output[key] = compileConditionNode(value);
        continue;
      }
      output[key] = compileConditionNode(value);
    }
    return output;
  }

  return _.cloneDeep(input);
}

export function normalizeReactionFilter(filter: FlowSurfaceReactionFilter | undefined): FlowSurfaceReactionFilter {
  if (_.isNil(filter)) {
    return _.cloneDeep(EMPTY_CONDITION);
  }
  if (!_.isPlainObject(filter)) {
    throwBadRequest('flowSurfaces reaction when must be an object');
  }
  const visit = (input: any): any => {
    if (Array.isArray(input)) {
      return input.map((item) => visit(item));
    }
    if (!_.isPlainObject(input)) {
      return _.cloneDeep(input);
    }
    if (Object.prototype.hasOwnProperty.call(input, 'source')) {
      return normalizeReactionValueExpr(input);
    }

    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === 'path') {
        output[key] = normalizeBarePath(value, 'condition.path');
        continue;
      }
      if (key === 'value') {
        output[key] = visit(value);
        continue;
      }
      output[key] = visit(value);
    }
    return output;
  };

  return visit(filter);
}

export function compileReactionFilter(filter: FlowSurfaceReactionFilter | undefined): FlowSurfaceReactionFilter {
  return compileConditionNode(normalizeReactionFilter(filter));
}

export function normalizeReactionPath(path: unknown, label: string) {
  return normalizeBarePath(path, label);
}
