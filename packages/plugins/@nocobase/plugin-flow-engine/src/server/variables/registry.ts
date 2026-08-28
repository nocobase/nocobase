/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { ResourcerContext } from '@nocobase/resourcer';
import { extractUsedVariablePaths } from '@nocobase/utils';
import { isProtectedServerContextKey } from '../template/context-keys';
import { HttpRequestContext, SERVER_CONTEXT_PROVIDER_TOKEN, ServerBaseContext } from '../template/contexts';
import { analyzeVariableTemplate, type PathSegment, type VariablePathRef } from '../template/variable-expression';
import { planRecordBindings, type AuthorizedRecordBinding, type RecordBindingPlan } from './record-bindings';
import { projectRecord } from './record-projection';
import { fetchRecordWithRequestCache } from './records';
import { compileRecordSlotPolicies, type RecordSlotPolicies } from './record-slot-policy';

export type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];

export type VarScope = 'global' | 'request';

export interface RequiredParamSpec {
  name: string;
  required?: boolean;
  defaultValue?: unknown;
}

export type ValidateContextParamsOptions = {
  contextParams: Record<string, unknown>;
  flowModelUid?: string;
  koaCtx: ResourcerContext;
  usage: readonly VariablePathRef[];
  varName: string;
};

export type ValidateContextParamsResult = {
  allowed?: boolean;
  contextParams?: Record<string, unknown>;
  requireFlowModel?: boolean;
};

export interface VariableDef {
  name: string; // e.g. 'record'
  scope: VarScope;
  requiredParams?: RequiredParamSpec[]; // for validation
  attach: (
    ctx: HttpRequestContext,
    koaCtx: ResourcerContext,
    params?: unknown,
    usage?: VarUsage,
  ) => Promise<void> | void;
  validateContextParams?: (
    options: ValidateContextParamsOptions,
  ) => Promise<ValidateContextParamsResult | void> | ValidateContextParamsResult | void;
}

export type VarUsage = Readonly<Record<string, readonly VariablePathRef[]>>;

type LegacyVarUsage = Record<string, string[]>;

class VariableRegistry {
  private vars = new Map<string, VariableDef>();

  register(def: VariableDef) {
    this.vars.set(def.name, def);
  }

  get(name: string) {
    return this.vars.get(name);
  }

  list() {
    return Array.from(this.vars.values());
  }

  extractUsage(template: JSONValue): LegacyVarUsage {
    // 复用公用工具，保持前后端一致的路径解析/规范化逻辑
    return extractUsedVariablePaths(template) as LegacyVarUsage;
  }

  validate(template: JSONValue, contextParams: unknown): { ok: boolean; missing?: string[] } {
    const usage = this.extractUsage(template);
    const missing: string[] = [];
    for (const varName of Object.keys(usage)) {
      const def = this.get(varName);
      if (!def?.requiredParams?.length) continue;
      const params = _.get(contextParams, varName);

      for (const spec of def.requiredParams) {
        if (!spec.required) continue;
        if (params && typeof params[spec.name] !== 'undefined') continue;
        missing.push(`contextParams.${varName}.${spec.name}`);
      }
    }
    return { ok: missing.length === 0, missing: missing.length ? missing : undefined };
  }

  async attachUsedVariables(
    ctx: HttpRequestContext,
    koaCtx: ResourcerContext,
    template: JSONValue,
    contextParams: Record<string, unknown>,
  ) {
    const usage = analyzeVariableTemplate(template).usage;
    return this.attachUsedVariablesFromUsage(ctx, koaCtx, usage, contextParams);
  }

  async attachUsedVariablesFromUsage(
    ctx: HttpRequestContext,
    koaCtx: ResourcerContext,
    usage: VarUsage,
    contextParams: Record<string, unknown>,
  ) {
    const policies = await compileRecordSlotPolicies(
      { paths: Object.values(usage).flat() },
      { app: koaCtx.app, ctx: koaCtx },
    );
    const plan = planRecordBindings({
      contextParams,
      koaCtx,
      policies,
      usage,
    });
    return this.attachUsedVariablesFromPlan(ctx, koaCtx, usage, await plan);
  }

  async attachUsedVariablesFromPlan(
    ctx: HttpRequestContext,
    koaCtx: ResourcerContext,
    usage: VarUsage,
    plan: RecordBindingPlan,
  ) {
    for (const varName of Object.keys(usage)) {
      const def = this.get(varName);
      const params = _.get(plan.contextParams, varName);
      if (def) {
        await def.attach(ctx, koaCtx, params, { [varName]: usage[varName] });
      }
    }
    attachAuthorizedRecordBindings(ctx, koaCtx, plan.bindings);
  }
}

/** 变量注册表（全局单例，确保 src/dist 共享同一实例） */
const GLOBAL_KEY = '__ncbVarRegistry__';
const g = (typeof globalThis !== 'undefined' ? globalThis : (global as unknown)) as Record<string, unknown>;

// Rebind a reused singleton from another module realm to the current implementation.
if (g[GLOBAL_KEY] && typeof g[GLOBAL_KEY] === 'object') {
  Object.setPrototypeOf(g[GLOBAL_KEY], VariableRegistry.prototype);
}

if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = new VariableRegistry();
}
export const variables: VariableRegistry = g[GLOBAL_KEY] as VariableRegistry;

/** 仅测试使用：重置变量注册表为内置默认集 */
// 注意：测试重置逻辑已迁移至测试工具，避免在实现文件中暴露仅供测试的 API。

export function omitVariableContextParams(
  contextParams: Record<string, unknown>,
  varName: string,
): Record<string, unknown> {
  if (!contextParams || typeof contextParams !== 'object') return {};
  const prefix = `${varName}.`;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(contextParams)) {
    if (key === varName || key.startsWith(prefix)) continue;
    next[key] = value;
  }
  return next;
}

export function sanitizeRegisteredVariableContextParams(
  contextParams: Record<string, unknown>,
  registry: { get?: (name: string) => VariableDef | undefined; list?: () => VariableDef[] } = variables,
): Record<string, unknown> {
  let next = contextParams;
  const defs =
    typeof registry.list === 'function'
      ? registry.list()
      : ['user'].map((name) => registry.get?.(name)).filter((def): def is VariableDef => !!def);
  for (const def of defs) {
    if (def.name === 'user') {
      next = omitVariableContextParams(next, def.name);
    }
  }
  return next;
}

/**
 * 从使用路径推断查询所需的 fields 与 appends。
 * @param paths 使用到的子路径数组
 * @param params 显式参数（仅用于兼容签名）
 */
export function inferSelectsFromUsage(
  paths: readonly (string | readonly PathSegment[])[] = [],
  _params?: unknown,
): { generatedAppends?: string[]; generatedFields?: string[] } {
  if (!Array.isArray(paths) || paths.length === 0) {
    return { generatedAppends: undefined, generatedFields: undefined };
  }

  const appendSet = new Set<string>();
  const fieldSet = new Set<string>();

  // 规范化：
  // - 将 ["name"] / ['name'] 转成 .name
  // - 去除任意位置的数字索引 [0]
  // - 折叠重复 '.' 并去除首尾 '.'
  const normalizePath = (raw: string): string => {
    if (!raw) return '';
    let s = String(raw);
    // 去掉所有数字索引（包括中间）
    s = s.replace(/\[(?:\d+)\]/g, '');
    // 将字符串索引标准化为点路径
    s = s.replace(/\[(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\]/g, (_m, g1, g2) => `.${(g1 || g2) as string}`);
    // 折叠多余点
    s = s.replace(/\.\.+/g, '.');
    // 去除起始/结尾点
    s = s.replace(/^\./, '').replace(/\.$/, '');
    return s;
  };

  for (const value of paths) {
    let segments: string[];
    if (Array.isArray(value)) {
      if (value.some((segment) => typeof segment === 'string' && segment.includes('.'))) {
        return { generatedAppends: undefined, generatedFields: undefined };
      }
      segments = value.filter((segment): segment is string => typeof segment === 'string' && !!segment);
    } else {
      let path = value;
      if (!path) continue;
      // Legacy wrapper only: normalize historical dotted/bracket paths.
      while (/^\[(\d+)\](\.|$)/.test(path)) {
        path = path.replace(/^\[(\d+)\]\.?/, '');
      }
      const norm = normalizePath(path);
      if (!norm) continue;
      segments = norm.split('.').filter(Boolean);
    }
    if (segments.length === 0) continue;

    if (segments.length === 1) {
      // 只有一段：表示顶层字段，加入 fields
      fieldSet.add(segments[0]);
      continue;
    }

    // 多段：逐级生成 appends（不包含最后一个字段段）
    // 例：roles.users.nickname -> ['roles', 'roles.users']
    for (let i = 0; i < segments.length - 1; i++) {
      appendSet.add(segments.slice(0, i + 1).join('.'));
    }

    // 同时将叶子字段完整路径加入 fields，减少关联载荷
    // 例：roles.users.nickname -> fields: ['roles.users.nickname']
    fieldSet.add(segments.join('.'));
  }

  const generatedAppends = appendSet.size ? Array.from(appendSet) : undefined;
  const generatedFields = fieldSet.size ? Array.from(fieldSet) : undefined;
  return { generatedAppends, generatedFields };
}

type RecordProviderNode = {
  binding?: AuthorizedRecordBinding;
  children: Map<PathSegment, RecordProviderNode>;
};

function createRecordProviderNode(): RecordProviderNode {
  return { children: new Map() };
}

function addRecordProviderBinding(root: RecordProviderNode, binding: AuthorizedRecordBinding) {
  let node = root;
  for (const segment of binding.prefix) {
    let child = node.children.get(segment);
    if (!child) {
      child = createRecordProviderNode();
      node.children.set(segment, child);
    }
    node = child;
  }
  if (node.binding) return false;
  node.binding = binding;
  return true;
}

function isProvidedByDescendant(node: RecordProviderNode, path: readonly PathSegment[]) {
  let current = node;
  for (const segment of path) {
    const child = current.children.get(segment);
    if (!child) return false;
    if (child.binding) return true;
    current = child;
  }
  return false;
}

function materializeRecordProvider(
  node: RecordProviderNode,
  values: ReadonlyMap<RecordProviderNode, unknown>,
  inherited?: unknown,
): unknown {
  const base = node.binding ? values.get(node) : inherited;
  if (!node.children.size) return base;

  if (Array.isArray(base)) {
    const result: unknown[] | Record<string, unknown> = Array.from(node.children.keys()).every(
      (segment) => typeof segment === 'number',
    )
      ? [...base]
      : Object.assign(Object.create(null), base);
    for (const [segment, child] of node.children) {
      if (typeof segment !== 'number') continue;
      result[segment] = materializeRecordProvider(child, values, result[segment]);
    }
    return result;
  }

  const result: Record<string, unknown> = _.isPlainObject(base)
    ? { ...(base as Record<string, unknown>) }
    : Object.create(null);
  for (const [segment, child] of node.children) {
    const key = String(segment);
    result[key] = materializeRecordProvider(child, values, result[key]);
  }
  return result;
}

export function isSafeRecordBinding(binding: AuthorizedRecordBinding) {
  return !isProtectedServerContextKey(binding.varName);
}

async function fetchBindingRecord(
  koaCtx: ResourcerContext,
  binding: AuthorizedRecordBinding,
  relativePaths = binding.relativePaths,
) {
  const strictSelects = Array.isArray(binding.params.fields) || Array.isArray(binding.params.appends);
  let { generatedAppends, generatedFields } = inferSelectsFromUsage(relativePaths);
  if (Array.isArray(binding.params.fields)) generatedFields = binding.params.fields;
  if (Array.isArray(binding.params.appends)) generatedAppends = binding.params.appends;
  const raw = await fetchRecordWithRequestCache(
    koaCtx,
    binding.params,
    generatedFields,
    generatedAppends,
    strictSelects,
    binding.preferFullRecord ||
      relativePaths.some((path) => path.some((segment) => typeof segment === 'string' && segment.includes('.'))),
  );
  return projectRecord(raw, relativePaths);
}

function attachAuthorizedRecordBindings(
  flowCtx: HttpRequestContext,
  koaCtx: ResourcerContext,
  bindings: readonly AuthorizedRecordBinding[],
) {
  const byVariable = new Map<string, RecordProviderNode>();
  const conflicts = new Set<string>();
  for (const binding of bindings) {
    if (!isSafeRecordBinding(binding)) continue;
    let root = byVariable.get(binding.varName);
    if (!root) {
      root = createRecordProviderNode();
      byVariable.set(binding.varName, root);
    }
    if (!addRecordProviderBinding(root, binding)) conflicts.add(binding.varName);
  }

  for (const [varName, root] of byVariable) {
    if (conflicts.has(varName)) continue;
    const resolveNode = async (node: RecordProviderNode) => {
      const entries: [RecordProviderNode, Promise<unknown>][] = [];
      const collect = (current: RecordProviderNode) => {
        if (current.binding) {
          const paths = current.binding.relativePaths.filter((path) => !isProvidedByDescendant(current, path));
          entries.push([current, fetchBindingRecord(koaCtx, current.binding, paths)]);
        }
        for (const child of current.children.values()) collect(child);
      };
      collect(node);
      const values = new Map<RecordProviderNode, unknown>();
      await Promise.all(entries.map(async ([current, pending]) => values.set(current, await pending)));
      return materializeRecordProvider(node, values);
    };
    const createProxy = (node: RecordProviderNode) => {
      const context = new ServerBaseContext();
      for (const [segment, child] of node.children) {
        context.defineProperty(String(segment), {
          get: () => (child.binding ? resolveNode(child) : createProxy(child)),
          cache: true,
        });
      }
      return context.createProxy();
    };
    flowCtx.defineProperty(varName, {
      get: () => (root.binding ? resolveNode(root) : createProxy(root)),
      cache: true,
    });
  }
}

export function registerBuiltInVariables(reg: VariableRegistry) {
  /**
   * Register `user` variable:
   * - No contextParams required or expected from client.
   * - Infers fields/appends from usage paths (e.g. ctx.user.roles[0].name -> appends: ['roles']).
   * - Loads current user from DB by primary key in koaCtx.auth.user.id.
   */
  reg.register({
    name: 'user',
    scope: 'request',
    // no requiredParams: frontend will not pass context params for user
    validateContextParams: ({ contextParams }) => ({
      allowed: true,
      contextParams: omitVariableContextParams(contextParams, 'user'),
    }),
    attach: (flowCtx, koaCtx, _params, usage) => {
      const paths = (usage?.user || []).map((path) => path.runtimeSegments);
      const { generatedAppends, generatedFields } = inferSelectsFromUsage(paths);

      flowCtx.defineProperty(
        'user',
        {
          get: async () => {
            const authObj = (koaCtx as ResourcerContext & { auth?: { user?: { id?: unknown } } }).auth;
            const uid = authObj?.user?.id;
            if (typeof uid === 'undefined' || uid === null) return undefined;
            return await fetchRecordWithRequestCache(
              koaCtx,
              { collection: 'users', dataSourceKey: 'main', filterByTk: uid },
              generatedFields,
              generatedAppends,
              false,
            );
          },
          cache: true,
        },
        SERVER_CONTEXT_PROVIDER_TOKEN,
      );
    },
  });

  reg.register({
    name: 'popup',
    scope: 'request',
    attach: () => {
      // Generic record-like contextParams attach popup.record,
      // popup.sourceRecord and popup.parent.* records.
    },
  });
}

// 初始化默认内置变量
registerBuiltInVariables(variables);
