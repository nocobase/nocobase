/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import deepmerge from 'deepmerge';
import _ from 'lodash';
import { isPlainObject } from './common';

type MergeStrategyType = 'merge' | 'deepMerge' | 'overwrite' | 'andMerge' | 'orMerge' | 'intersect' | 'union';
type MergeStrategyFunc = (x: any, y: any) => any;

export type MergeStrategy = MergeStrategyType | MergeStrategyFunc;

export interface MergeStrategies {
  [key: string]: MergeStrategy;
}

function getEnumerableOwnPropertySymbols(target: any): any[] {
  return Object.getOwnPropertySymbols
    ? Object.getOwnPropertySymbols(target).filter((symbol) => target.propertyIsEnumerable(symbol))
    : [];
}

function getKeys(target: any) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}

export const mergeStrategies = new Map<MergeStrategyType, MergeStrategyFunc>();

mergeStrategies.set('overwrite', (x, y) => {
  if (y === undefined) {
    if (typeof x === 'string' && x.includes(',')) {
      return x.split(',');
    }
    return x;
  }
  if (typeof y === 'string' && y.includes(',')) {
    y = y.split(',');
  }
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
  return _.uniq((x || []).concat(y || [])).filter(Boolean);
});

mergeStrategies.set('intersect', (x, y) =>
  (() => {
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
  })().filter(Boolean),
);

export function assign(target: any, source: any, strategies: MergeStrategies = {}) {
  const sourceKeys = getKeys(source);
  const targetKeys = getKeys(target);
  _.uniq([...sourceKeys, ...targetKeys]).forEach((sourceKey) => {
    const strategy = strategies[sourceKey];
    let func: any;
    if (typeof strategy === 'function') {
      func = strategy;
    } else if (typeof strategy === 'string' && mergeStrategies.has(strategy as any)) {
      func = mergeStrategies.get(strategy as any);
    }
    if (func) {
      target[sourceKey] = func(target[sourceKey], source[sourceKey]);
    } else if (sourceKeys.includes(sourceKey)) {
      const func = mergeStrategies.get('deepMerge');
      target[sourceKey] = func(target[sourceKey], source[sourceKey]);
    }
  });
  return target;
}
