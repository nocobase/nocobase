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
      data[path] = data.map((item) => item[path]);
    }
    data = data?.[path];
  }
}

export function evaluate(this: Evaluator, expression: string, scope: Scope = {}) {
  const context = cloneDeep(scope);
  const newContext = {};
  const exp = expression.trim().replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => {
    appendArrayColumn(context, v);

    let item = get(context, v);

    if (typeof item === 'function') {
      item = item();
    }

    const randomKey = `$$${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;
    if (item == null) {
      return 'null';
    }
    newContext[randomKey] = item;
    return ` ${randomKey} `;
  });

  return this(exp, newContext);
}
