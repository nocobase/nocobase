import { get, cloneDeep } from 'lodash';

export type Scope = { [key: string]: any };

export type Evaluator = (expression: string, scope?: Scope) => any;

function appendArrayColumn(scope, key) {
  const paths = key.split('.');
  let data = scope;
  for (let p = 0; p < paths.length; p++) {
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
  const exp = expression.trim().replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => {
    appendArrayColumn(context, v);
    const item = get(context, v);
    const key = v.replace(/\.(\d+)/g, '["$1"]');
    return ` ${typeof item === 'function' ? item() : key} `;
  });
  return this(exp, context);
}
