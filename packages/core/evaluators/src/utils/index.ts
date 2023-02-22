import { get } from "lodash";



export type Scope = { [key: string]: any };

export type Evaluator = (expression: string, scope?: Scope) => any;

export function evaluate(this: Evaluator, expression: string, scope: Scope = {}) {
  const exp = expression.trim().replace(/{{\s*([^{}]+)\s*}}/g, (_, v) => {
    const item = get(scope, v);
    const key = v.replace(/\.(\d+)/g, '["$1"]');
    return ` ${typeof item === 'function' ? item() : key} `;
  });
  return this(exp, scope);
}
