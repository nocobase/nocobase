/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { get, cloneDeep } from 'lodash';

export type Scope = { [key: string]: any };

export type Evaluator = (expression: string, scope?: Scope) => any;

export function appendArrayColumn(scope, key) {
  const paths = key.split('.');
  let data = scope;
  for (let p = 0; p < paths.length && data != null; p++) {
    const path = paths[p];
    const isIndex = path.match(/^\d+$/);
    if (Array.isArray(data) && !isIndex && !data[path]) {
      data[path] = data.map((item) => item[path]).flat();
    }
    data = data?.[path];
  }
}

interface EvaluatorOptions {
  replaceValue?: boolean;
}

export function evaluate(this: Evaluator, options: EvaluatorOptions = {}, expression: string, scope: Scope = {}) {
  const context = cloneDeep(scope);
  const newContext = {};
  const keyMap = {};
  let index = 0;
  const exp = expression.trim().replace(/{{\s*([\w$.-]+)\s*}}/g, (_, v) => {
    if (v.startsWith('this.')) {
      // 适配handlebar
      return `{{${v}}}`;
    }
    appendArrayColumn(context, v);

    let item = get(context, v) ?? null;

    if (typeof item === 'function') {
      item = item();
    }

    let key = keyMap[v];
    if (!key) {
      key = `$$${index++}`;
      keyMap[v] = key;

      newContext[key] = item;
    }
    return options.replaceValue
      ? `${item == null || (typeof item === 'number' && (Number.isNaN(item) || !Number.isFinite(item))) ? '' : item}`
      : key;
  });

  return this(exp, newContext);
}
