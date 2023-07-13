import deepmerge from 'deepmerge';
import lodash from 'lodash';
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

mergeStrategies.set('overwrite', (_, y) => {
  if (typeof y === 'string') {
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
  return lodash.uniq((x || []).concat(y || [])).filter(Boolean);
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
