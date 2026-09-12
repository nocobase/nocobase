/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'ses';
import { lockdownSes } from '@nocobase/utils';
import { ServerBaseContext } from './contexts';
import {
  analyzeVariableTemplate,
  getVariableCanonicalKey,
  type AnalyzedExpression,
  type AnalyzedTemplate,
  type AnalyzedTemplateNode,
  type PathSegment,
  type ResolvePathPolicy,
} from './variable-expression';

export type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

type SandboxContextSource = {
  getSandboxKeys: () => string[];
  getSandboxValue: (key: string) => unknown;
};

type SandboxScope = {
  proxyCache: WeakMap<object, unknown>;
  proxyMeta: WeakMap<object, object>;
};

const BLOCKED_SANDBOX_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
let resolverLockdownReady = false;

/**
 * 解析 JSON 模板中形如 {{ ... }} 的占位符（服务端解析）。
 * 无法解析或不受支持的表达式将原样保留。
 */
export async function resolveJsonTemplate(template: JSONValue, ctx: unknown): Promise<any> {
  const analysis = analyzeVariableTemplate(template);
  return resolveAnalyzedJsonTemplate(analysis, ctx, {
    allowAll: true,
    allowedPaths: new Set(),
    unrestrictedVariables: new Set(),
  });
}

/**
 * 执行已分析的模板。授权、挂载和执行链路应复用同一个 analysis 与 policy。
 */
export async function resolveAnalyzedJsonTemplate(
  analysis: AnalyzedTemplate,
  ctx: unknown,
  policy: ResolvePathPolicy,
): Promise<any> {
  const policySnapshot: ResolvePathPolicy = Object.freeze({
    allowAll: policy.allowAll,
    allowedPaths: new Set(policy.allowedPaths),
    unrestrictedVariables: new Set(policy.unrestrictedVariables),
  });
  return resolveAnalyzedNode(analysis.value, ctx, policySnapshot);
}

async function resolveAnalyzedNode(node: AnalyzedTemplateNode, ctx: unknown, policy: ResolvePathPolicy): Promise<any> {
  if (node.kind === 'value') return node.value;
  if (node.kind === 'string') return replaceAnalyzedPlaceholders(node, ctx, policy);
  if (node.kind === 'array') return Promise.all(node.items.map((item) => resolveAnalyzedNode(item, ctx, policy)));

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.entries)) {
    out[key] = await resolveAnalyzedNode(value, ctx, policy);
  }
  return out;
}

async function replaceAnalyzedPlaceholders(
  node: Extract<AnalyzedTemplateNode, { kind: 'string' }>,
  ctx: unknown,
  policy: ResolvePathPolicy,
) {
  const single = node.expressions.length === 1 && node.expressions[0].placeholderSpan.start === 0;
  if (single && node.expressions[0].placeholderSpan.end === node.source.length) {
    const value = await evaluateAnalyzedExpression(node.expressions[0], ctx, policy);
    return typeof value === 'undefined' ? node.source : value;
  }

  let result = '';
  let cursor = 0;
  for (const expression of node.expressions) {
    result += node.source.slice(cursor, expression.placeholderSpan.start);
    const placeholder = node.source.slice(expression.placeholderSpan.start, expression.placeholderSpan.end);
    const value = await evaluateAnalyzedExpression(expression, ctx, policy);
    if (typeof value === 'undefined') {
      result += placeholder;
    } else {
      result += typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
    }
    cursor = expression.placeholderSpan.end;
  }
  return result + node.source.slice(cursor);
}

function createSandboxScope(): SandboxScope {
  return { proxyCache: new WeakMap(), proxyMeta: new WeakMap() };
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
  if (!descriptor || !('value' in descriptor) || typeof descriptor.value === 'function') return undefined;
  return descriptor;
}

function getPrimitiveDataDescriptor(source: unknown, key: string) {
  if (source == null || isObjectLike(source)) return undefined;
  return getSandboxDataDescriptor(Object(source), key);
}

function isSandboxContextSource(value: unknown): value is SandboxContextSource {
  return value instanceof ServerBaseContext;
}

function wrapSandboxValue(scope: SandboxScope, value: unknown): unknown {
  if (isTrustedPromise(value)) {
    return Promise.prototype.then.call(value, (resolved) => wrapSandboxValue(scope, resolved));
  }
  if (typeof value === 'function') return undefined;
  if (!isObjectLike(value)) return value;
  if (scope.proxyMeta.has(value)) return value;

  const cached = scope.proxyCache.get(value);
  if (cached) return cached;

  const proxy = isSandboxContextSource(value)
    ? createSandboxContextProxy(scope, value)
    : createSandboxDataProxy(scope, value as Record<PropertyKey, unknown>);

  scope.proxyCache.set(value, proxy);
  scope.proxyMeta.set(proxy, value);
  return proxy;
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

function createSandboxContextProxy(scope: SandboxScope, source: SandboxContextSource) {
  return new Proxy(Object.create(null), {
    get: (_target, key) => {
      if (isBlockedSandboxKey(key) || typeof key !== 'string' || !source.getSandboxKeys().includes(key)) {
        return undefined;
      }
      return wrapSandboxValue(scope, source.getSandboxValue(key));
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
        value: wrapSandboxValue(scope, source.getSandboxValue(key)),
      };
    },
    getPrototypeOf: () => null,
    setPrototypeOf: () => false,
    preventExtensions: () => false,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
}

function createSandboxDataProxy(scope: SandboxScope, source: Record<PropertyKey, unknown>) {
  const target = Array.isArray(source) ? new Array(source.length) : Object.create(null);
  return new Proxy(target, {
    get: (_target, key) => {
      const descriptor = getSandboxDataDescriptor(source, key);
      return descriptor ? wrapSandboxValue(scope, descriptor.value) : undefined;
    },
    has: (_target, key) => !!getSandboxDataDescriptor(source, key),
    ownKeys: () => {
      const keys = Reflect.ownKeys(source).filter((key) => !!getSandboxDataDescriptor(source, key));
      if (Array.isArray(source) && !keys.includes('length')) keys.push('length');
      return keys;
    },
    getOwnPropertyDescriptor: (proxyTarget, key) => {
      if (Array.isArray(source) && key === 'length') {
        return Reflect.getOwnPropertyDescriptor(proxyTarget, key);
      }
      const descriptor = getSandboxDataDescriptor(source, key);
      if (!descriptor) return undefined;
      return {
        configurable: true,
        enumerable: descriptor.enumerable,
        writable: false,
        value: wrapSandboxValue(scope, descriptor.value),
      };
    },
    getPrototypeOf: () => null,
    setPrototypeOf: () => false,
    preventExtensions: () => false,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
}

async function unwrapSandboxValue(
  scope: SandboxScope,
  value: unknown,
  seen = new WeakMap<object, unknown>(),
): Promise<unknown> {
  const resolved = isTrustedPromise(value) ? await value : value;
  if (typeof resolved === 'function') return undefined;
  if (!isObjectLike(resolved)) return resolved;

  const meta = scope.proxyMeta.get(resolved);
  const source = meta ?? resolved;
  if (typeof source === 'function') return undefined;
  if (seen.has(source)) return seen.get(source);
  if (Buffer.isBuffer(source)) return Buffer.prototype.toJSON.call(source);

  if (isSandboxContextSource(source)) {
    const out: Record<string, unknown> = {};
    seen.set(source, out);
    for (const key of source.getSandboxKeys()) {
      if (BLOCKED_SANDBOX_KEYS.has(key)) continue;
      out[key] = await unwrapSandboxValue(scope, wrapSandboxValue(scope, source.getSandboxValue(key)), seen);
    }
    return out;
  }

  if (Array.isArray(source)) {
    const out: unknown[] = [];
    seen.set(source, out);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(source, 'length');
    const length = typeof lengthDescriptor?.value === 'number' ? lengthDescriptor.value : 0;
    for (let index = 0; index < length; index++) {
      const descriptor = getSandboxDataDescriptor(source, String(index));
      if (!descriptor) continue;
      out.push(await unwrapSandboxValue(scope, descriptor.value, seen));
    }
    return out;
  }

  if (source instanceof Date) return source;

  const out: Record<string, unknown> = {};
  seen.set(source, out);
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const descriptor = getSandboxDataDescriptor(source, key);
    if (!descriptor) continue;
    out[key] = await unwrapSandboxValue(scope, descriptor.value, seen);
  }
  return out;
}

function getRootSandboxValue(scope: SandboxScope, ctx: unknown, key: string) {
  if (BLOCKED_SANDBOX_KEYS.has(key) || !isSandboxContextSource(ctx) || !ctx.getSandboxKeys().includes(key)) {
    return undefined;
  }
  return wrapSandboxValue(scope, ctx.getSandboxValue(key));
}

async function getSandboxProperty(scope: SandboxScope, value: unknown, key: string) {
  if (BLOCKED_SANDBOX_KEYS.has(key)) return undefined;

  const resolved = isTrustedPromise(value) ? await value : value;
  if (resolved == null) return undefined;

  const meta = isObjectLike(resolved) ? scope.proxyMeta.get(resolved) : undefined;
  const source = meta ?? resolved;

  if (isSandboxContextSource(source)) {
    if (!source.getSandboxKeys().includes(key)) return undefined;
    return wrapSandboxValue(scope, source.getSandboxValue(key));
  }
  if (typeof source === 'function') return undefined;
  if (!isObjectLike(source)) {
    const descriptor = getPrimitiveDataDescriptor(source, key);
    return descriptor ? wrapSandboxValue(scope, descriptor.value) : undefined;
  }
  const descriptor = getSandboxDataDescriptor(source, key);
  return descriptor ? wrapSandboxValue(scope, descriptor.value) : undefined;
}

function copyRuntimeSegments(segments: unknown): PathSegment[] | undefined {
  if (!Array.isArray(segments)) return undefined;
  const copy: PathSegment[] = [];
  for (const segment of segments) {
    if (typeof segment !== 'string' && typeof segment !== 'number') return undefined;
    copy.push(segment);
  }
  return copy;
}

function isPathAllowed(varName: unknown, segments: unknown, policy: ResolvePathPolicy) {
  if (typeof varName !== 'string') return undefined;
  const runtimeSegments = copyRuntimeSegments(segments);
  if (!runtimeSegments) return undefined;
  if (
    !policy.allowAll &&
    !policy.unrestrictedVariables.has(varName) &&
    !policy.allowedPaths.has(getVariableCanonicalKey(varName, runtimeSegments))
  ) {
    return undefined;
  }
  return runtimeSegments;
}

async function resolveGuardedPath(
  scope: SandboxScope,
  ctx: unknown,
  policy: ResolvePathPolicy,
  aggregateArrays: boolean,
  varName: unknown,
  segments: unknown,
) {
  try {
    const runtimeSegments = isPathAllowed(varName, segments, policy);
    if (!runtimeSegments || typeof varName !== 'string') return undefined;
    const root = getRootSandboxValue(scope, ctx, varName);
    return resolveSandboxSegments(scope, root, runtimeSegments, aggregateArrays);
  } catch (_) {
    return undefined;
  }
}

async function resolveSandboxSegments(
  scope: SandboxScope,
  value: unknown,
  segments: readonly PathSegment[],
  aggregateArrays: boolean,
): Promise<unknown> {
  const resolved = isTrustedPromise(value) ? await value : value;
  if (!segments.length || resolved == null) return resolved;

  const [segment, ...rest] = segments;
  const meta = isObjectLike(resolved) ? scope.proxyMeta.get(resolved) : undefined;
  const source = meta ?? resolved;
  const key = String(segment);
  if (aggregateArrays && typeof segment === 'string' && Array.isArray(source) && key !== 'length') {
    const result: unknown[] = [];
    const length = Reflect.getOwnPropertyDescriptor(source, 'length')?.value;
    for (let index = 0; index < (typeof length === 'number' ? length : 0); index++) {
      const descriptor = getSandboxDataDescriptor(source, String(index));
      if (!descriptor) continue;
      const part = await resolveSandboxSegments(scope, descriptor.value, segments, true);
      await appendAggregatedValue(scope, result, part);
    }
    return wrapSandboxValue(
      scope,
      result.filter((item) => item !== null),
    );
  }

  const next = await getSandboxProperty(scope, resolved, key);
  return resolveSandboxSegments(scope, next, rest, aggregateArrays);
}

async function appendAggregatedValue(scope: SandboxScope, result: unknown[], value: unknown) {
  const resolved = isTrustedPromise(value) ? await value : value;
  const meta = isObjectLike(resolved) ? scope.proxyMeta.get(resolved) : undefined;
  const source = meta ?? resolved;
  if (!Array.isArray(source)) {
    if (typeof resolved !== 'undefined') result.push(resolved);
    return;
  }
  const length = Reflect.getOwnPropertyDescriptor(source, 'length')?.value;
  for (let index = 0; index < (typeof length === 'number' ? length : 0); index++) {
    const descriptor = getSandboxDataDescriptor(source, String(index));
    if (descriptor) result.push(wrapSandboxValue(scope, descriptor.value));
  }
}

function isStandalonePath(expression: AnalyzedExpression) {
  const path = expression.paths[0];
  return (
    !!path &&
    expression.paths.length === 1 &&
    !expression.source.slice(0, path.span.start - expression.expressionSpan.start).trim() &&
    !expression.source.slice(path.span.end - expression.expressionSpan.start).trim()
  );
}

function createGuardedCallable(source: (...args: unknown[]) => unknown) {
  const callable = (...args: unknown[]) => Reflect.apply(source, undefined, args);
  return new Proxy(callable, {
    apply: (_target, _thisArg, args) => Reflect.apply(source, undefined, args),
    get: () => undefined,
    has: () => false,
    ownKeys: () => [],
    getOwnPropertyDescriptor: () => undefined,
    getPrototypeOf: () => null,
    setPrototypeOf: () => false,
    preventExtensions: () => false,
    set: () => false,
    defineProperty: () => false,
    deleteProperty: () => false,
  });
}

async function evaluateAnalyzedExpression(
  expression: AnalyzedExpression,
  ctx: unknown,
  policy: ResolvePathPolicy,
): Promise<unknown> {
  if (!expression.supported) return undefined;
  try {
    const scope = createSandboxScope();
    const aggregateArrays = isStandalonePath(expression);
    const helper = createGuardedCallable((varName, segments) =>
      resolveGuardedPath(scope, ctx, policy, aggregateArrays, varName, segments),
    );
    ensureResolverLockdown();
    const compartment = new Compartment();
    const factory = compartment.evaluate(
      `async (${expression.helperIdentifier}) => { try { return ${expression.compiled}; } catch (_) { return undefined; } }`,
    ) as (helper: (...args: unknown[]) => unknown) => Promise<unknown>;
    return await unwrapSandboxValue(scope, await factory(helper));
  } catch (_) {
    return undefined;
  }
}
