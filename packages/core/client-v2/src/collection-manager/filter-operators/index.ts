/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as standardFieldFilterOperatorGroups from './operators';
import type { FieldFilterOperator } from './operators';

export * from './operators';

export type FieldFilterOperatorPreset = keyof typeof standardFieldFilterOperatorGroups;

export type FieldFilterOperatorGroupName = FieldFilterOperatorPreset | (string & {});

export type FieldFilterOperatorReference<TMeta = unknown> = FieldFilterOperator<TMeta> | string;

export type FieldFilterOperatorList<TMeta = unknown> = FieldFilterOperator<TMeta>[] | FieldFilterOperatorGroupName;

export type FieldFilterable<TMeta = unknown> = {
  operators?: FieldFilterOperatorList<TMeta>;
  operatorGroup?: string;
  operatorOverrides?: FieldFilterOperator<TMeta>[];
  children?: unknown[];
  nested?: boolean;
  [key: string]: unknown;
};

export class FieldFilterOperatorRegistry {
  protected operators: Record<string, FieldFilterOperator> = {};
  protected groups: Record<string, FieldFilterOperator[]> = {};

  constructor(groups: Record<string, FieldFilterOperator[]> = {}) {
    Object.entries(groups).forEach(([name, operatorList]) => {
      this.registerGroup(name, operatorList);
    });
  }

  register(operator: FieldFilterOperator) {
    this.operators[operator.value] = operator;
    return this;
  }

  registerMany(operators: FieldFilterOperator[] = []) {
    operators.forEach((operator) => {
      this.register(operator);
    });
    return this;
  }

  registerGroup(name: string, operators: FieldFilterOperatorReference[] = []) {
    const operatorList = this.resolveOperatorReferences(operators);
    this.registerMany(operatorList);
    this.groups[name] = operatorList;
    return this;
  }

  addToGroup(name: string, operators: FieldFilterOperatorReference[] = []) {
    const operatorList = this.resolveOperatorReferences(operators);
    this.registerMany(operatorList);
    if (!this.groups[name]) {
      this.groups[name] = [];
    }
    operatorList.forEach((operator) => {
      if (!this.groups[name].some((item) => item.value === operator.value)) {
        this.groups[name].push(operator);
      }
    });
    return this;
  }

  get(name: string) {
    return this.operators[name];
  }

  getGroup(name: string) {
    return this.groups[name] || [];
  }

  getGroups() {
    return this.groups;
  }

  resolveOperators<TMeta = unknown>(operators?: FieldFilterOperatorList<TMeta>): FieldFilterOperator<TMeta>[] {
    if (!operators) {
      return [];
    }

    if (typeof operators === 'string') {
      return this.getGroup(operators) as FieldFilterOperator<TMeta>[];
    }

    return operators;
  }

  protected resolveOperatorReferences(operators: FieldFilterOperatorReference[] = []) {
    return operators
      .map((operator) => (typeof operator === 'string' ? this.get(operator) : operator))
      .filter((operator): operator is FieldFilterOperator => Boolean(operator));
  }
}

export const filterOperatorRegistry = new FieldFilterOperatorRegistry(standardFieldFilterOperatorGroups);

export const fieldFilterOperators = filterOperatorRegistry.getGroups() as Record<string, FieldFilterOperator[]> &
  typeof standardFieldFilterOperatorGroups;

export const fieldFilterOperatorPresets = fieldFilterOperators;

export function resolveFilterOperators<TMeta = unknown>(
  operators?: FieldFilterOperatorList<TMeta>,
): FieldFilterOperator<TMeta>[] {
  return filterOperatorRegistry.resolveOperators(operators);
}

export function normalizeFilterableOperators<TMeta = unknown>(filterable?: FieldFilterable<TMeta>) {
  if (!filterable) {
    return filterable;
  }

  const operatorOverrides = Array.isArray(filterable.operatorOverrides) ? filterable.operatorOverrides : [];

  if (filterable.operatorGroup) {
    filterable.operators = mergeOperatorOverrides(resolveFilterOperators(filterable.operatorGroup), operatorOverrides);
  }

  const rawOperators = (filterable as { operators?: unknown }).operators;
  if (typeof rawOperators === 'string') {
    filterable.operatorGroup = rawOperators;
    filterable.operators = mergeOperatorOverrides(resolveFilterOperators(rawOperators), operatorOverrides);
  } else if (Array.isArray(rawOperators)) {
    filterable.operators = mergeOperatorOverrides(rawOperators, operatorOverrides);
  } else if (operatorOverrides.length > 0) {
    filterable.operators = [...operatorOverrides];
  }

  if (Array.isArray(filterable.children)) {
    filterable.children.forEach((child) => {
      if (child && typeof child === 'object') {
        normalizeFilterableOperators(child as FieldFilterable<TMeta>);
      }
    });
  }

  return filterable;
}

function mergeOperatorOverrides<TMeta = unknown>(
  operators: FieldFilterOperator<TMeta>[] = [],
  operatorOverrides: FieldFilterOperator<TMeta>[] = [],
) {
  if (operatorOverrides.length === 0) {
    return operators;
  }

  const result = [...operators];
  operatorOverrides.forEach((operatorOverride) => {
    const existingIndex = result.findIndex((item) => item.value === operatorOverride.value);
    if (existingIndex === -1) {
      result.push(operatorOverride);
    } else {
      result[existingIndex] = operatorOverride;
    }
  });
  return result;
}

export function createFilterable<TPreset extends FieldFilterOperatorGroupName>(
  preset: TPreset,
  options: Omit<FieldFilterable, 'operators'> = {},
): FieldFilterable {
  return {
    ...options,
    operatorGroup: preset,
    operators: resolveFilterOperators(preset),
  };
}

export function createTypedFilterable<TMeta = unknown>(
  groups: Array<{
    types: string[];
    operators: FieldFilterOperatorList<TMeta>;
  }>,
  resolveType: (meta: TMeta) => string,
): FieldFilterable<TMeta> {
  return {
    operators: groups.flatMap(({ types, operators: operatorList }) =>
      resolveFilterOperators(operatorList).map((operator) => ({
        ...operator,
        visible: (meta: TMeta) => {
          const matches = types.includes(resolveType(meta));
          if (typeof operator.visible === 'function') {
            return operator.visible(meta) && matches;
          }
          return matches;
        },
      })),
    ),
  };
}
