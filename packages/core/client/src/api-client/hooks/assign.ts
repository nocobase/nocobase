/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isPlainObject } from '@nocobase/utils/client';
import deepmerge from 'deepmerge';
import uniq from 'lodash/uniq';

type MergeStrategyType = 'merge' | 'deepMerge' | 'overwrite' | 'andMerge' | 'orMerge' | 'intersect' | 'union';
type MergeStrategyFunc = (x: any, y: any) => any;

export type MergeStrategy = MergeStrategyType | MergeStrategyFunc;

export interface MergeStrategies {
  [key: string]: MergeStrategy;
}

function getEnumerableOwnPropertySymbols(target: any): any[] {
  return Object.getOwnPropertySymbols
    ? Object.getOwnPropertySymbols(target).filter((symbol) => ({}).propertyIsEnumerable.call(target, symbol))
    : [];
}

function getKeys(target: any) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}

export const mergeStrategies = new Map<MergeStrategyType, MergeStrategyFunc>();

mergeStrategies.set('overwrite', (_, y) => {
  return y;
});

mergeStrategies.set('andMerge', (x, y) => {
  if (!x && !y) {
    return;
  }
  if (!x) {
    return y;
  }
  if (!y) {
    return x;
  }
  return {
    $and: [x, y],
  };
});

mergeStrategies.set('orMerge', (x, y) => {
  if (!x && !y) {
    return;
  }
  if (!x) {
    return y;
  }
  if (!y) {
    return x;
  }
  return {
    $or: [x, y],
  };
});

mergeStrategies.set('deepMerge', (x, y) => {
  return isPlainObject(x) && isPlainObject(y)
    ? deepmerge(x, y, {
        arrayMerge: (x, y) => y,
      })
    : y;
});

mergeStrategies.set('merge', (x, y) => {
  return isPlainObject(x) && isPlainObject(y) ? Object.assign(x, y) : y;
});

mergeStrategies.set('union', (x, y) => {
  if (typeof x === 'string') {
    x = x.split(',');
  }
  if (typeof y === 'string') {
    y = y.split(',');
  }
  return uniq((x || []).concat(y || []));
});

mergeStrategies.set('intersect', (x, y) => {
  if (typeof x === 'string') {
    x = x.split(',');
  }
  if (typeof y === 'string') {
    y = y.split(',');
  }
  if (!Array.isArray(x) || x.length === 0) {
    return y || [];
  }
  if (!Array.isArray(y) || y.length === 0) {
    return x || [];
  }
  return x.filter((v) => y.includes(v));
});

export function assign(target: any, source: any, strategies: MergeStrategies = {}) {
  getKeys(source).forEach((sourceKey) => {
    const strategy = strategies[sourceKey];
    let func = mergeStrategies.get('deepMerge');
    if (typeof strategy === 'function') {
      func = strategy;
    } else if (typeof strategy === 'string' && mergeStrategies.has(strategy as any)) {
      func = mergeStrategies.get(strategy as any);
    }
    target[sourceKey] = func(target[sourceKey], source[sourceKey]);
  });
  return target;
}
