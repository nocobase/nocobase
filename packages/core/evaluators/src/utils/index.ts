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

function replaceNumberIndex(path: string, scope: Scope): string {
  const segments = path.split('.');
  const paths: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const p = segments[i];
    if (p[0] && '0123456789'.indexOf(p[0]) > -1) {
      paths.push(Array.isArray(get(scope, segments.slice(0, i))) ? `[${p}]` : `["${p}"]`);
    } else {
      if (i) {
        paths.push('.', p);
      } else {
        paths.push(p);
      }
    }
  }

  return paths.join('');
}

export function evaluate(this: Evaluator, expression: string, scope: Scope = {}) {
  const context = cloneDeep(scope);
  const exp = expression.trim().replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => {
    appendArrayColumn(context, v);

    const item = get(context, v);

    let result;

    if (item == null) {
      result = 'null';
    } else if (typeof item === 'function') {
      result = item();
      result = typeof result === 'string' ? `'${result.replace(/'/g, "\\'")}'` : result;
    } else {
      result = replaceNumberIndex(v, context);
    }

    if (result instanceof Date) {
      result = `'${result.toISOString()}'`;
    }

    return ` ${result} `;
  });
  return this(exp, context);
}
