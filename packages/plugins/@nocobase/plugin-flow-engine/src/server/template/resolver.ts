/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'ses';
import _ from 'lodash';

// TODO: 是否有必要lockdown?
// // 使用 SES 进行隔离
// declare const lockdown: any;
// try {
//   // 测试环境下避免执行全局 lockdown，以免冻结测试依赖（如 Vitest/Chai）
//   const env = (typeof process !== 'undefined' && (process as any)?.env) ? (process as any).env : {} as any;
//   if (typeof lockdown === 'function' && env.NODE_ENV !== 'test') {
//     lockdown({ errorTaming: 'unsafe', consoleTaming: 'unsafe' });
//   }
// } catch (_) {
//   // ignore
// }

export type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];

/**
 * 解析 JSON 模板中形如 {{ ... }} 的占位符（服务端解析）。
 * 仅支持以 ctx 开头的路径与表达式（如：{{ ctx.user.id }}、{{ ctx.record.roles[0].name }}）。
 * 无法解析或不受支持的表达式将原样保留。
 *
 * @param template 要解析的对象/数组/字符串模板
 * @param ctx 变量上下文（实现了所需属性/方法的代理对象）
 * @returns 解析后的结果，与输入结构相同
 */
export async function resolveJsonTemplate(template: JSONValue, ctx: any): Promise<any> {
  const compile = async (source: any): Promise<any> => {
    if (typeof source === 'string' && /\{\{.*?\}\}/.test(source)) {
      return await replacePlaceholders(source, ctx);
    }
    if (Array.isArray(source)) return Promise.all(source.map(compile));
    if (source && typeof source === 'object') {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(source)) out[k] = await compile(v);
      return out;
    }
    return source;
  };
  return compile(template);
}

async function replacePlaceholders(input: string, ctx: any) {
  const single = input.match(/^\{\{\s*(.+)\s*\}\}$/);
  if (single) {
    const val = await evaluate(single[1], ctx);
    return typeof val === 'undefined' ? input : val;
  }
  const regex = /\{\{\s*(.+?)\s*\}\}/g;
  let result = input;
  const matches = [...input.matchAll(regex)];
  for (const [full, inner] of matches) {
    const value = await evaluate(inner, ctx);
    if (typeof value !== 'undefined') {
      const replacement = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
      result = result.replace(full, replacement);
    }
  }
  return result;
}

// 在 SES 沙箱中执行完整的 JS 表达式；在此之前会将 ctx.* 访问改写为 await __get(var, path)
async function evaluate(expr: string, ctx: any) {
  try {
    const transformed = preprocessExpression(expr.trim());
    const compartment = new Compartment({
      ctx,
      __get: (varName: string, path?: string) => getAtPath(ctx, varName, path),
      console,
    });
    const wrapped = `(async () => { try { return ${transformed}; } catch (e) { return undefined; } })()`;
    return await compartment.evaluate(wrapped);
  } catch (_) {
    return undefined;
  }
}

// __get(varName, pathString?) -> Promise<any>
// 从 ctx 中获取指定变量并按路径取值（支持异步）。
async function getAtPath(ctx: any, varName: string, path?: string) {
  try {
    // base may be Promise; wait once
    // @ts-ignore ctx is in Compartment endowments via closure
    const base = await (ctx as any)[varName];
    if (!path) return base;
    const norm = path.replace(/^\./, '');
    return _.get(base, norm);
  } catch (_) {
    return undefined;
  }
}

/**
 * 将表达式中的 ctx 访问改写为内部 __get 调用。
 * 例如：ctx.user.id + 1 => (await __get('user', '.id')) + 1
 *
 * @param expression 原始表达式字符串
 * @returns 改写后的表达式字符串
 */
export function preprocessExpression(expression: string): string {
  let out = '';
  let i = 0;
  const n = expression.length;
  while (i < n) {
    // find next 'ctx.' or 'ctx[' occurrence
    const dotIdx = expression.indexOf('ctx.', i);
    const brkIdx = expression.indexOf('ctx[', i);
    let idx = -1;
    if (dotIdx === -1) idx = brkIdx;
    else if (brkIdx === -1) idx = dotIdx;
    else idx = Math.min(dotIdx, brkIdx);

    if (idx === -1) {
      out += expression.slice(i);
      break;
    }

    // copy preceding text
    out += expression.slice(i, idx);

    let j = idx + 3; // after 'ctx'
    let varName: string | null = null;
    let pathStr = '';

    if (expression[j] === '.') {
      j += 1;
      const varMatch = /^[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(expression.slice(j));
      if (!varMatch) {
        out += 'ctx.'; // keep literal and move on
        i = j;
        continue;
      }
      varName = varMatch[0];
      j += varName.length;
    } else if (expression[j] === '[') {
      // bracket var: ctx['user'] or ctx["user"]
      const m = /^\[("((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\]/.exec(expression.slice(j));
      if (!m) {
        out += 'ctx[';
        i = j;
        continue;
      }
      varName = (m[2] ?? m[3]) as string; // unescaped content
      j += m[0].length;
    } else {
      // not a recognized ctx access
      out += expression.slice(idx, idx + 3);
      i = idx + 3;
      continue;
    }

    // parse rest path: sequence of .ident or [index|"str"|'str']
    while (j < n) {
      if (expression[j] === '.') {
        const m = /^\.[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(expression.slice(j));
        if (!m) break;
        pathStr += m[0];
        j += m[0].length;
      } else if (expression[j] === '[') {
        const m = /^(\[(?:\d+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\])/.exec(expression.slice(j));
        if (!m) break;
        pathStr += m[1];
        j += m[1].length;
      } else {
        break;
      }
    }

    const argPath = pathStr ? `, ${JSON.stringify(pathStr)}` : '';
    out += `(await __get(${JSON.stringify(varName)}${argPath}))`;
    i = j;
  }
  return out;
}
