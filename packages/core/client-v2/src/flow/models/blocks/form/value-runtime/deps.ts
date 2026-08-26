/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { toJS } from '@formily/reactive';
import { extractUsedVariablePaths, extractUsedVariablePathsFromRunJS, isRunJSValue } from '@nocobase/flow-engine';
import _ from 'lodash';
import { buildAncestorKeys, parsePathString } from './path';
import type { NamePath } from './types';

export type DepCollector = {
  deps: Set<string>;
  wildcard: boolean;
};
function shouldProxyObjectValue(val: any) {
  if (!val || typeof val !== 'object') return false;
  return Array.isArray(val) || _.isPlainObject(val);
}
export function recordDep(namePath: NamePath, collector: DepCollector | undefined) {
  if (!collector) return;
  for (const k of buildAncestorKeys(namePath)) {
    collector.deps.add(`fv:${k}`);
  }
}

export function createFormValuesProxy(options: {
  valuesMirror: any;
  basePath: NamePath;
  collector?: DepCollector;
  getFormValuesSnapshot: () => any;
  getFormValueAtPath: (namePath: NamePath) => any;
}): any {
  const { valuesMirror, collector, basePath, getFormValuesSnapshot, getFormValueAtPath } = options;

  const getTarget = () => (basePath.length ? _.get(valuesMirror, basePath) : valuesMirror);
  const target = getTarget();
  const proxyTarget =
    target && (typeof target === 'object' || typeof target === 'function') ? target : Array.isArray(target) ? [] : {};

  const asProxy = (nextBasePath: NamePath) =>
    createFormValuesProxy({
      valuesMirror,
      basePath: nextBasePath,
      collector,
      getFormValuesSnapshot,
      getFormValueAtPath,
    });

  return new Proxy(proxyTarget as any, {
    get(_t, key: PropertyKey) {
      if (key === 'toJSON') {
        if (collector) collector.wildcard = true;
        if (basePath.length === 0) {
          return () => getFormValuesSnapshot();
        }
        return () => toJS(getTarget());
      }
      if (typeof key === 'symbol') {
        if (collector) collector.wildcard = true;
        const actual = getTarget();
        return actual?.[key as any];
      }
      const actual = getTarget();
      if (actual == null) return undefined;
      if (key === '__raw') return actual;

      // 防止原型链污染类 key 被当成路径读取/写入
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
        if (collector) collector.wildcard = true;
        return undefined;
      }

      const isArray = Array.isArray(actual);
      const isNumericIndex =
        isArray &&
        ((typeof key === 'number' && Number.isInteger(key)) || (typeof key === 'string' && /^\d+$/.test(key)));

      // Array 的非 index 属性（length/map/forEach/...）不视为 NamePath
      if (isArray && !isNumericIndex) {
        if (collector) collector.wildcard = true;
        const v = actual[key as any];
        return typeof v === 'function' ? v.bind(actual) : v;
      }

      const nextSeg = isNumericIndex ? Number(key) : (key as unknown as string | number);
      const nextPath = [...basePath, nextSeg];
      recordDep(nextPath, collector);

      const val = actual[key as any];
      let finalVal = val;

      // 仅在 mirror 缺失时尝试从 form 读取同步，避免误写入 Array 的内置属性（length/map/...）
      if (typeof finalVal === 'undefined') {
        const fetched = getFormValueAtPath(nextPath);
        if (!_.isEqual(fetched, finalVal)) {
          _.set(valuesMirror, nextPath, fetched);
          finalVal = fetched;
        }
      }

      if (finalVal == null || typeof finalVal !== 'object') return finalVal;
      return shouldProxyObjectValue(finalVal) ? asProxy(nextPath) : finalVal;
    },
    ownKeys() {
      if (collector) collector.wildcard = true;
      const actual = getTarget();
      return actual ? Reflect.ownKeys(actual) : [];
    },
    getOwnPropertyDescriptor(_t, prop: PropertyKey) {
      const actual = getTarget();
      if (!actual) return undefined;
      return Object.getOwnPropertyDescriptor(actual, prop);
    },
    has(_t, prop: PropertyKey) {
      const actual = getTarget();
      if (!actual) return false;
      return prop in actual;
    },
  });
}

export function collectStaticDepsFromTemplateValue(value: any, collector: DepCollector) {
  try {
    const usage = extractUsedVariablePaths(value as any) || {};
    for (const [varName, rawPaths] of Object.entries(usage)) {
      const paths = Array.isArray(rawPaths) ? rawPaths : [];
      // NOTE: extractUsedVariablePaths 在 `{{ ctx.foo }}` 场景下会生成空数组，表示顶层变量被使用
      const normalized = paths.length ? paths : [''];

      for (const subPath of normalized) {
        if (varName === 'formValues') {
          if (!subPath) {
            collector.wildcard = true;
            continue;
          }
          const segs = parsePathString(String(subPath)).filter((seg) => typeof seg !== 'object') as NamePath;
          recordDep(segs, collector);
          continue;
        }

        const key = subPath ? `ctx:${varName}:${String(subPath)}` : `ctx:${varName}`;
        collector.deps.add(key);
      }
    }
  } catch {
    // ignore
  }
}

export function collectStaticDepsFromRunJSValue(value: any, collector: DepCollector) {
  if (!isRunJSValue(value)) return;
  try {
    const usage = extractUsedVariablePathsFromRunJS(value.code) || {};
    for (const [varName, rawPaths] of Object.entries(usage)) {
      const paths = Array.isArray(rawPaths) ? rawPaths : [];
      const normalized = paths.length ? paths : [''];

      for (const subPath of normalized) {
        if (varName === 'formValues') {
          if (!subPath) {
            collector.wildcard = true;
            continue;
          }
          const segs = parsePathString(String(subPath)).filter((seg) => typeof seg !== 'object') as NamePath;
          recordDep(segs, collector);
          continue;
        }

        const key = subPath ? `ctx:${varName}:${String(subPath)}` : `ctx:${varName}`;
        collector.deps.add(key);
      }
    }
  } catch {
    // ignore
  }
}
