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

// Harden with SES (best-effort)
declare const lockdown: any;
try {
  if (typeof lockdown === 'function') {
    lockdown({ errorTaming: 'unsafe', consoleTaming: 'unsafe' });
  }
} catch (_) {
  // ignore
}

export type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];

/**
 * Server-side JSON template resolver for {{ ... }} placeholders.
 * Supports ctx path expressions only, e.g. {{ ctx.user.id }}, {{ ctx.record.roles[0].name }}.
 * Unsupported expressions are preserved as-is.
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

// Evaluate full JS expression in SES, rewriting ctx paths into await __get(var, path)
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

// Turn ctx.user.id + 1 into (await __get('user','.id')) + 1
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
