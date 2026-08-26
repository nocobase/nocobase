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
import { lockdownSes } from '@nocobase/utils';
import { ServerBaseContext } from './contexts';

export type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];

type SandboxContextSource = {
  getSandboxKeys: () => string[];
  getSandboxValue: (key: string) => unknown;
};

type SandboxProxyKind = 'context' | 'data' | 'function';

const BLOCKED_SANDBOX_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const sandboxProxyCache = new WeakMap<object, unknown>();
const sandboxProxyMeta = new WeakMap<object, { kind: SandboxProxyKind; source: unknown }>();
const EMPTY_SANDBOX_CONTEXT: SandboxContextSource = {
  getSandboxKeys: () => [],
  getSandboxValue: () => undefined,
};
let resolverLockdownReady = false;

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

function isObjectLike(value: unknown): value is object {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function isTrustedPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise;
}

function isBlockedSandboxKey(key: PropertyKey) {
  return typeof key === 'string' && BLOCKED_SANDBOX_KEYS.has(key);
}

function getSandboxDataDescriptor(source: object, key: PropertyKey) {
  if (isBlockedSandboxKey(key) || typeof key === 'symbol') return undefined;
  const descriptor = Reflect.getOwnPropertyDescriptor(source, key);
  if (!descriptor || !('value' in descriptor)) return undefined;
  if (key === 'then' && typeof descriptor.value === 'function') return undefined;
  return descriptor;
}

function getPrimitiveDataDescriptor(source: unknown, key: string) {
  if (source == null || isObjectLike(source)) return undefined;
  return getSandboxDataDescriptor(Object(source), key);
}

function isSandboxContextSource(value: unknown): value is SandboxContextSource {
  return value === EMPTY_SANDBOX_CONTEXT || value instanceof ServerBaseContext;
}

function wrapSandboxValue(value: unknown): unknown {
  if (isTrustedPromise(value)) {
    return Promise.prototype.then.call(value, (resolved) => wrapSandboxValue(resolved));
  }
  if (!isObjectLike(value)) return value;
  if (sandboxProxyMeta.has(value)) return value;

  const cached = sandboxProxyCache.get(value);
  if (cached) return cached;

  const kind: SandboxProxyKind = isSandboxContextSource(value)
    ? 'context'
    : typeof value === 'function'
      ? 'function'
      : 'data';
  const proxy =
    kind === 'context'
      ? createSandboxContextProxy(value as SandboxContextSource)
      : kind === 'function'
        ? createSandboxFunctionProxy(value as (...args: unknown[]) => unknown)
        : createSandboxDataProxy(value as Record<PropertyKey, unknown>);

  sandboxProxyCache.set(value, proxy);
  sandboxProxyMeta.set(proxy as object, { kind, source: value });
  return proxy;
}

function wrapRootSandboxContext(ctx: unknown) {
  return wrapSandboxValue(isSandboxContextSource(ctx) ? ctx : EMPTY_SANDBOX_CONTEXT);
}

function ensureResolverLockdown() {
  if (resolverLockdownReady) return;
  lockdownSes({
    consoleTaming: 'unsafe',
    errorTaming: 'unsafe',
    overrideTaming: 'moderate',
    stackFiltering: 'verbose',
  });
  resolverLockdownReady = true;
}

function createSandboxContextProxy(source: SandboxContextSource) {
  return new Proxy(Object.create(null), {
    get: (_target, key) => {
      if (isBlockedSandboxKey(key) || typeof key !== 'string') return undefined;
      if (!source.getSandboxKeys().includes(key)) return undefined;
      return wrapSandboxValue(source.getSandboxValue(key));
    },
    has: (_target, key) => typeof key === 'string' && source.getSandboxKeys().includes(key),
    ownKeys: () => source.getSandboxKeys(),
    getOwnPropertyDescriptor: (_target, key) => {
      if (isBlockedSandboxKey(key) || typeof key !== 'string' || !source.getSandboxKeys().includes(key)) {
        return undefined;
      }
      return {
        configurable: true,
        enumerable: true,
        value: wrapSandboxValue(source.getSandboxValue(key)),
      };
    },
    getPrototypeOf: () => null,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
}

function createSandboxFunctionProxy(source: (...args: unknown[]) => unknown) {
  const callable = (...args: unknown[]) => Reflect.apply(source, undefined, args);
  return new Proxy(callable, {
    apply: (_target, _thisArg, argArray) => wrapSandboxValue(Reflect.apply(source, undefined, argArray)),
    get: (_target, key) => {
      if (key === 'length' || key === 'name') return Reflect.get(source, key);
      return undefined;
    },
    has: (_target, key) => key === 'length' || key === 'name',
    ownKeys: () => [],
    getOwnPropertyDescriptor: () => undefined,
    getPrototypeOf: () => null,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
}

function createSandboxDataProxy(source: Record<PropertyKey, unknown>) {
  const target = Array.isArray(source) ? new Array(source.length) : Object.create(null);
  return new Proxy(target, {
    get: (_target, key) => {
      const descriptor = getSandboxDataDescriptor(source, key);
      if (!descriptor) return undefined;
      const value = descriptor.value;
      return typeof value === 'function' ? wrapSandboxValue(value.bind(source)) : wrapSandboxValue(value);
    },
    has: (_target, key) => {
      if (isBlockedSandboxKey(key) || typeof key !== 'string') return false;
      return !!getSandboxDataDescriptor(source, key);
    },
    ownKeys: () => {
      const keys = Reflect.ownKeys(source).filter((key) => {
        if (typeof key !== 'string' || isBlockedSandboxKey(key)) return false;
        return !!getSandboxDataDescriptor(source, key);
      });
      if (Array.isArray(source) && !keys.includes('length')) keys.push('length');
      return keys;
    },
    getOwnPropertyDescriptor: (proxyTarget, key) => {
      if (isBlockedSandboxKey(key) || typeof key === 'symbol') return undefined;
      if (Array.isArray(source) && key === 'length') {
        return Reflect.getOwnPropertyDescriptor(proxyTarget, key);
      }
      const descriptor = getSandboxDataDescriptor(source, key);
      if (!descriptor) return undefined;
      return {
        configurable: true,
        enumerable: descriptor.enumerable,
        writable: false,
        value: wrapSandboxValue(descriptor.value),
      };
    },
    getPrototypeOf: () => null,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
}

async function unwrapSandboxValue(value: unknown, seen = new WeakMap<object, unknown>()): Promise<unknown> {
  const resolved = isTrustedPromise(value) ? await value : value;
  if (!isObjectLike(resolved)) return resolved;

  const meta = sandboxProxyMeta.get(resolved);
  if (meta?.kind === 'function' || typeof resolved === 'function') return undefined;
  const source = meta?.source ?? resolved;
  if (!isObjectLike(source)) return source;

  if (seen.has(source)) return seen.get(source);

  if (isSandboxContextSource(source)) {
    const out: Record<string, unknown> = {};
    seen.set(source, out);
    for (const key of source.getSandboxKeys()) {
      if (BLOCKED_SANDBOX_KEYS.has(key)) continue;
      out[key] = await unwrapSandboxValue(wrapSandboxValue(source.getSandboxValue(key)), seen);
    }
    return out;
  }

  if (Array.isArray(source)) {
    const out: unknown[] = [];
    seen.set(source, out);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(source, 'length');
    const length = typeof lengthDescriptor?.value === 'number' ? lengthDescriptor.value : 0;
    for (let index = 0; index < length; index++) {
      const descriptor = Reflect.getOwnPropertyDescriptor(source, String(index));
      if (!descriptor || !('value' in descriptor)) continue;
      out.push(await unwrapSandboxValue(descriptor.value, seen));
    }
    return out;
  }

  if (source instanceof Date) return source;

  const out: Record<string, unknown> = {};
  seen.set(source, out);
  for (const key of Object.keys(source as Record<string, unknown>)) {
    if (BLOCKED_SANDBOX_KEYS.has(key)) continue;
    const descriptor = getSandboxDataDescriptor(source, key);
    if (!descriptor) continue;
    out[key] = await unwrapSandboxValue(descriptor.value, seen);
  }
  return out;
}

function getRootSandboxValue(ctx: unknown, key: string) {
  if (BLOCKED_SANDBOX_KEYS.has(key)) return undefined;
  if (isSandboxContextSource(ctx)) {
    if (!ctx.getSandboxKeys().includes(key)) return undefined;
    return wrapSandboxValue(ctx.getSandboxValue(key));
  }
  return undefined;
}

async function getSandboxProperty(value: unknown, key: string) {
  if (BLOCKED_SANDBOX_KEYS.has(key)) return undefined;

  const resolved = isTrustedPromise(value) ? await value : value;
  if (resolved == null) return undefined;

  const meta = isObjectLike(resolved) ? sandboxProxyMeta.get(resolved) : undefined;
  const source = meta?.source ?? resolved;

  if (isSandboxContextSource(source)) {
    if (!source.getSandboxKeys().includes(key)) return undefined;
    return wrapSandboxValue(source.getSandboxValue(key));
  }

  if (typeof source === 'function') {
    return key === 'length' || key === 'name' ? Reflect.get(source, key) : undefined;
  }

  if (!isObjectLike(source)) {
    const descriptor = getPrimitiveDataDescriptor(source, key);
    if (!descriptor || typeof descriptor.value === 'function') return undefined;
    return wrapSandboxValue(descriptor.value);
  }
  const descriptor = getSandboxDataDescriptor(source, key);
  if (!descriptor) return undefined;
  const current = descriptor.value;
  return typeof current === 'function' ? wrapSandboxValue(current.bind(source)) : wrapSandboxValue(current);
}

// 在 SES 沙箱中执行完整的 JS 表达式；在此之前会将 ctx.* 访问改写为 await __get(var, path)
async function evaluate(expr: string, ctx: any) {
  try {
    const raw = expr.trim();

    // 优先处理仅点号路径的聚合：ctx.a.b.c（不支持括号/函数/索引）
    // 顶层变量名仍使用 JS 标识符规则；子路径允许包含 '-'（例如 formValues.roles.a-b）。
    const dotOnly = raw.match(
      /^ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\.([a-zA-Z_$][a-zA-Z0-9_$-]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$-]*)*))?$/,
    );
    if (dotOnly) {
      const first = dotOnly[1];
      const rest = dotOnly[2];
      const base = getRootSandboxValue(ctx, first);
      if (!rest) return await unwrapSandboxValue(wrapSandboxValue(base));
      // 使用异步版本取值，逐段 await，并保留数组场景下的隐式聚合语义
      const resolved = await asyncGetValuesByPath(base, rest);
      // 当 dot path 含 '-' 时可能与减号运算符存在歧义（例如：ctx.aa.bb-ctx.cc）。
      // 若按 path 解析未取到值，则回退到 JS 表达式解析，尽量保持兼容。
      if (typeof resolved !== 'undefined' || !rest.includes('-')) {
        return await unwrapSandboxValue(resolved);
      }
    }

    const transformed = preprocessExpression(raw);
    ensureResolverLockdown();
    const compartment = new Compartment({
      ctx: wrapRootSandboxContext(ctx),
      __get: wrapSandboxValue((varName: string, path?: string) => getAtPath(ctx, varName, path)),
    });
    const wrapped = `(async () => { try { return ${transformed}; } catch (e) { return undefined; } })()`;
    return await unwrapSandboxValue(await compartment.evaluate(wrapped));
  } catch (_) {
    return undefined;
  }
}

// __get(varName, pathString?) -> Promise<any>
// 从 ctx 中获取指定变量并按路径取值（支持异步）。
async function getAtPath(ctx: any, varName: string, path?: string) {
  try {
    // base may be Promise; wait once
    let current = getRootSandboxValue(ctx, varName);
    if (!path) return current;
    const norm = String(path || '').replace(/^\./, '');
    const segments = _.toPath(norm);
    for (const seg of segments) {
      if (current == null) return undefined;
      current = await getSandboxProperty(current, seg);
    }
    return wrapSandboxValue(current);
  } catch (_) {
    return undefined;
  }
}

/**
 * 异步版本的 getValuesByPath：
 * - 逐段访问路径，若某段值为 Promise，则 await 后再继续。
 * - 当中途遇到数组时，对数组进行聚合：对每个元素递归解析剩余路径并扁平合并。
 * - 返回规则与原 getValuesByPath 尽量一致：
 *   - 命中数组：返回去除 null 的数组；
 *   - 非数组：返回首个值；
 *   - 全部未命中：返回 defaultValue（默认 undefined）。
 */
async function asyncGetValuesByPath(obj: any, path: string, defaultValue?: any): Promise<any> {
  try {
    // 允许 obj 为 Promise
    let currentValue: any = await obj;
    if (!currentValue) return defaultValue;

    const keys = String(path || '').split('.');
    let result: any[] = [];
    let shouldReturnArray = false;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // 数组：对每个元素递归解析剩余路径并聚合
      if (Array.isArray(currentValue)) {
        shouldReturnArray = true;
        const rest = keys.slice(i).join('.');
        const parts = await Promise.all(
          Array.prototype.map.call(currentValue, (el) => asyncGetValuesByPath(el, rest, defaultValue)),
        );
        // 将数组或标量统一拍平一层
        for (const p of parts) {
          if (Array.isArray(p)) {
            for (let index = 0; index < p.length; index++) {
              if (typeof p[index] !== 'undefined') result.push(p[index]);
            }
          } else if (typeof p !== 'undefined') result.push(p);
        }
        break;
      }

      // 普通对象属性访问，若为 Promise 则等待
      currentValue = await getSandboxProperty(currentValue, key);

      if (i === keys.length - 1) {
        result.push(currentValue);
      }
    }

    // 过滤 undefined
    result = result.filter((item) => typeof item !== 'undefined');

    if (result.length === 0) return defaultValue;
    if (shouldReturnArray) return result.filter((item) => item !== null);
    return result[0];
  } catch (_) {
    return defaultValue;
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
