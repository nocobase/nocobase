/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';

type Comparer = (a: any, b: any) => boolean;

export const calculators = new Registry<Comparer>();

// built-in functions
function equal(a, b) {
  return a == b;
}

function notEqual(a, b) {
  return a != b;
}

function gt(a, b) {
  return a > b;
}

function gte(a, b) {
  return a >= b;
}

function lt(a, b) {
  return a < b;
}

function lte(a, b) {
  return a <= b;
}

calculators.register('equal', equal);
calculators.register('notEqual', notEqual);
calculators.register('gt', gt);
calculators.register('gte', gte);
calculators.register('lt', lt);
calculators.register('lte', lte);

calculators.register('==', equal);
calculators.register('!=', notEqual);
calculators.register('>', gt);
calculators.register('>=', gte);
calculators.register('<', lt);
calculators.register('<=', lte);

function includes(a, b) {
  return a.includes(b);
}

function notIncludes(a, b) {
  return !a.includes(b);
}

function startsWith(a: string, b: string) {
  return a.toString().startsWith(b.toString());
}

function notStartsWith(a: string, b: string) {
  return !a.toString().startsWith(b.toString());
}

function endsWith(a: string, b: string) {
  return a.toString().endsWith(b.toString());
}

function notEndsWith(a: string, b: string) {
  return !a.toString().endsWith(b.toString());
}

calculators.register('includes', includes);
calculators.register('notIncludes', notIncludes);
calculators.register('startsWith', startsWith);
calculators.register('notStartsWith', notStartsWith);
calculators.register('endsWith', endsWith);
calculators.register('notEndsWith', notEndsWith);

type CalculationItem = {
  calculator?: string;
  operands?: [any?, any?];
};

type CalculationGroup = {
  group: {
    type: 'and' | 'or';
    calculations?: Calculation[];
  };
};

export type Calculation = CalculationItem | CalculationGroup;

function calculate(calculation: CalculationItem = {}): boolean {
  let fn: Comparer;
  if (!calculation.calculator || !calculation.operands?.length) {
    return true;
  }
  if (!(fn = calculators.get(calculation.calculator))) {
    throw new Error(`no calculator function registered for "${calculation.calculator}"`);
  }
  return Boolean(fn(...(calculation.operands ?? [])));
}

const GroupTypeMethodMap = {
  and: 'every',
  or: 'some',
};

export function logicCalculate(calculation?: Calculation) {
  if (!calculation) {
    return true;
  }

  if (typeof calculation['group'] === 'object') {
    const method = GroupTypeMethodMap[calculation['group'].type];
    return (calculation['group'].calculations ?? [])[method]((item: Calculation) => logicCalculate(item));
  }

  return calculate(calculation as CalculationItem);
}
