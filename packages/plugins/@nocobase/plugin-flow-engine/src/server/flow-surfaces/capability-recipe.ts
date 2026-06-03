/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FlowSurfaceAggregateError, type FlowSurfaceErrorItemInput } from './errors';
import type {
  FlowSurfaceCapabilityValidationError,
  FlowSurfaceDynamicCapabilityPublicInput,
  FlowSurfaceInitParamSpec,
  FlowSurfaceJsonCreateRecipe,
  FlowSurfaceNodeDomain,
  FlowSurfaceNodeLens,
  FlowSurfaceNodeSpec,
  FlowSurfaceSettingBinding,
} from './types';

const LENS_DOMAINS = new Set<FlowSurfaceNodeDomain>(['props', 'decoratorProps', 'stepParams', 'flowRegistry']);
const UNSAFE_LENS_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

export function resolveJsonCreateRecipe(input: {
  recipe: FlowSurfaceJsonCreateRecipe;
  publicInput: FlowSurfaceDynamicCapabilityPublicInput;
}): FlowSurfaceNodeSpec {
  const errors: FlowSurfaceCapabilityValidationError[] = [];
  if (!isJsonSafe(input.recipe.nodeTemplate)) {
    errors.push({
      path: 'settings',
      code: 'unsupported',
      message: 'capability create recipe is not JSON-safe',
    });
  }
  const node = _.cloneDeep(input.recipe.nodeTemplate);
  errors.push(
    ...applyInitParamLenses(node, input.recipe.initParams || [], input.publicInput.initParams || {}),
    ...applySettingLenses(node, input.recipe.settings || [], input.publicInput.settings || {}),
  );
  if (errors.length) {
    throwCapabilityValidationErrors(errors);
  }
  return node;
}

function applyInitParamLenses(
  node: FlowSurfaceNodeSpec,
  specs: FlowSurfaceInitParamSpec[],
  values: Record<string, unknown>,
) {
  const errors: FlowSurfaceCapabilityValidationError[] = [];
  specs.forEach((spec) => {
    const publicPath = `initParams.${spec.name}`;
    const value = values[spec.name];
    if (spec.required && _.isUndefined(value)) {
      errors.push({
        path: publicPath,
        code: 'required',
        message: `${publicPath} is required`,
      });
      return;
    }
    if (_.isUndefined(value) || !spec.internalLens) {
      return;
    }
    errors.push(...applyLenses(node, spec.internalLens, value, publicPath));
  });
  return errors;
}

function applySettingLenses(
  node: FlowSurfaceNodeSpec,
  specs: FlowSurfaceSettingBinding[],
  values: Record<string, unknown>,
) {
  const errors: FlowSurfaceCapabilityValidationError[] = [];
  specs.forEach((spec) => {
    const value = values[spec.key];
    if (_.isUndefined(value) || !spec.internalLens) {
      return;
    }
    errors.push(...applyLenses(node, spec.internalLens, value, `settings.${spec.key}`));
  });
  return errors;
}

function applyLenses(
  node: FlowSurfaceNodeSpec,
  lens: FlowSurfaceNodeLens | FlowSurfaceNodeLens[],
  value: unknown,
  publicPath: string,
) {
  return (Array.isArray(lens) ? lens : [lens]).flatMap((item) => applyLens(node, item, value, publicPath));
}

function applyLens(
  node: FlowSurfaceNodeSpec,
  lens: FlowSurfaceNodeLens,
  value: unknown,
  publicPath: string,
): FlowSurfaceCapabilityValidationError[] {
  if (!LENS_DOMAINS.has(lens.domain)) {
    return invalidRecipeMapping(publicPath);
  }
  const path = parseSafeLensPath(lens.path);
  if (!path) {
    return invalidRecipeMapping(publicPath);
  }
  if (!isJsonSafe(value)) {
    return [
      {
        path: publicPath,
        code: 'invalid-type',
        message: `${publicPath} must be JSON-safe`,
      },
    ];
  }
  const container = ensureDomainContainer(node, lens.domain);
  if (!container) {
    return invalidRecipeMapping(publicPath);
  }
  const parent = ensurePathParent(container, path.slice(0, -1));
  if (!parent) {
    return invalidRecipeMapping(publicPath);
  }
  const key = path[path.length - 1];
  const mode = lens.mode || 'set';
  if (mode === 'merge') {
    return applyMerge(parent, key, value, publicPath);
  }
  if (mode === 'append') {
    return applyAppend(parent, key, value, publicPath);
  }
  parent[key] = _.cloneDeep(value);
  return [];
}

function ensureDomainContainer(node: FlowSurfaceNodeSpec, domain: FlowSurfaceNodeDomain) {
  const containers = node as FlowSurfaceNodeSpec & Partial<Record<FlowSurfaceNodeDomain, Record<string, unknown>>>;
  const existing = containers[domain];
  if (_.isUndefined(existing)) {
    containers[domain] = {};
    return containers[domain];
  }
  return _.isPlainObject(existing) ? (existing as Record<string, unknown>) : undefined;
}

function ensurePathParent(root: Record<string, unknown>, path: string[]) {
  let parent = root;
  for (const segment of path) {
    const value = parent[segment];
    if (_.isUndefined(value)) {
      const next: Record<string, unknown> = {};
      parent[segment] = next;
      parent = next;
      continue;
    }
    if (!_.isPlainObject(value)) {
      return undefined;
    }
    parent = value as Record<string, unknown>;
  }
  return parent;
}

function applyMerge(
  parent: Record<string, unknown>,
  key: string,
  value: unknown,
  publicPath: string,
): FlowSurfaceCapabilityValidationError[] {
  if (!_.isPlainObject(value)) {
    return [
      {
        path: publicPath,
        code: 'invalid-type',
        message: `${publicPath} must be an object`,
      },
    ];
  }
  const existing = parent[key];
  if (!_.isUndefined(existing) && !_.isPlainObject(existing)) {
    return invalidRecipeMapping(publicPath);
  }
  parent[key] = _.merge({}, existing || {}, value);
  return [];
}

function applyAppend(
  parent: Record<string, unknown>,
  key: string,
  value: unknown,
  publicPath: string,
): FlowSurfaceCapabilityValidationError[] {
  const existing = parent[key];
  if (_.isUndefined(existing)) {
    parent[key] = [_.cloneDeep(value)];
    return [];
  }
  if (!Array.isArray(existing)) {
    return invalidRecipeMapping(publicPath);
  }
  parent[key] = [...existing, _.cloneDeep(value)];
  return [];
}

function parseSafeLensPath(path: string) {
  const normalized = typeof path === 'string' ? path.trim() : '';
  if (!normalized || normalized.includes('[') || normalized.includes(']') || normalized.includes('/')) {
    return null;
  }
  if (normalized.includes('\\')) {
    return null;
  }
  const segments = normalized.split('.');
  if (segments.some((segment) => !segment || UNSAFE_LENS_SEGMENTS.has(segment) || segment.trim() !== segment)) {
    return null;
  }
  return segments;
}

function invalidRecipeMapping(publicPath: string): FlowSurfaceCapabilityValidationError[] {
  return [
    {
      path: publicPath,
      code: 'unsupported',
      message: `${publicPath} has an unsupported create recipe mapping`,
    },
  ];
}

function isJsonSafe(value: unknown): boolean {
  if (_.isUndefined(value) || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
    return false;
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonSafe(item));
  }
  if (!_.isPlainObject(value)) {
    return false;
  }
  return Object.entries(value as Record<string, unknown>).every(
    ([key, item]) => parseSafeLensPath(key) !== null && isJsonSafe(item),
  );
}

function throwCapabilityValidationErrors(errors: FlowSurfaceCapabilityValidationError[]): never {
  throw new FlowSurfaceAggregateError(
    errors.map(
      (error): FlowSurfaceErrorItemInput => ({
        message: error.message,
        path: error.path,
        ruleId: error.code,
        details: error.details,
      }),
    ),
  );
}
