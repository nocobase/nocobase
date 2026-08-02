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
import { HttpRequestContext, ServerBaseContext } from '../template/contexts';
import { analyzeVariableTemplate, type PathSegment, type VariablePathRef } from '../template/variable-expression';
import { fetchRecordWithRequestCache, isRecordParams, type RecordParams } from './records';

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
  allowGenericRecordContext?: boolean;
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
    return this.attachUsedVariablesFromUsage(ctx, koaCtx, analyzeVariableTemplate(template).usage, contextParams);
  }

  async attachUsedVariablesFromUsage(
    ctx: HttpRequestContext,
    koaCtx: ResourcerContext,
    usage: VarUsage,
    contextParams: Record<string, unknown>,
  ) {
    for (const varName of Object.keys(usage)) {
      const def = this.get(varName);
      const params = _.get(contextParams, varName);
      if (def) {
        await def.attach(ctx, koaCtx, params, { [varName]: usage[varName] });
      }
    }

    // After running explicit variable defs, attach generic record-like variables based on contextParams shape.
    attachGenericRecordVariables(ctx, koaCtx, usage, contextParams, this.vars);
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

/**
 * Attach record-like variables dynamically for any varName based on contextParams shape.
 * Supports:
 * - Top-level: contextParams[varName] is record params -> define ctx[varName]
 * - Nested: contextParams[varName][seg] is record params and template uses ctx[varName].seg.* -> define nested record
 */
function attachGenericRecordVariables(
  flowCtx: HttpRequestContext,
  koaCtx: ResourcerContext,
  usage: VarUsage,
  contextParams: Record<string, unknown>,
  explicitVariables: Map<string, VariableDef> = new Map(),
) {
  const normalizeContextSegment = (segment: string): PathSegment => (/^\d+$/.test(segment) ? Number(segment) : segment);
  const startsWithSegments = (path: readonly PathSegment[], prefix: readonly PathSegment[]) =>
    prefix.every((segment, index) => path[index] === segment);
  const collectNestedRecords = (
    value: unknown,
    prefix: readonly PathSegment[],
    records: Map<string, { params: RecordParams; segments: readonly PathSegment[] }>,
  ) => {
    if (isRecordParams(value)) {
      records.set(JSON.stringify(prefix), { params: value, segments: prefix });
      return;
    }
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      collectNestedRecords(child, [...prefix, Array.isArray(value) ? normalizeContextSegment(key) : key], records);
    }
  };
  const fetchRecord = (params: RecordParams, paths: readonly (readonly PathSegment[])[], preferFullRecord: boolean) => {
    const strictSelects = Array.isArray(params.fields) || Array.isArray(params.appends);
    let { generatedAppends, generatedFields } = inferSelectsFromUsage(paths);
    if (Array.isArray(params.fields)) generatedFields = params.fields;
    if (Array.isArray(params.appends)) generatedAppends = params.appends;
    const needsFullRecord = paths.some((path) =>
      path.some((segment) => typeof segment === 'string' && segment.includes('.')),
    );
    return fetchRecordWithRequestCache(
      koaCtx,
      params,
      generatedFields,
      generatedAppends,
      strictSelects,
      preferFullRecord || needsFullRecord,
    );
  };

  for (const [varName, refs] of Object.entries(usage)) {
    const explicitVariable = explicitVariables.get(varName);
    if (explicitVariable && !explicitVariable.allowGenericRecordContext) continue;

    const usedPaths = refs.map((ref) => ref.runtimeSegments);
    const topParams = _.get(contextParams, varName);
    const nestedRecords = new Map<string, { params: RecordParams; segments: readonly PathSegment[] }>();
    if (!isRecordParams(topParams)) collectNestedRecords(topParams, [], nestedRecords);
    for (const [key, value] of Object.entries(contextParams)) {
      if (!key.startsWith(`${varName}.`) || !isRecordParams(value)) continue;
      const segments = key
        .slice(varName.length + 1)
        .split('.')
        .filter(Boolean)
        .map(normalizeContextSegment);
      if (segments.length) nestedRecords.set(JSON.stringify(segments), { params: value, segments });
    }

    if (isRecordParams(topParams)) {
      const basePaths = usedPaths.filter(
        (path) => ![...nestedRecords.values()].some(({ segments }) => startsWithSegments(path, segments)),
      );
      const preferFullRecord = basePaths.some((path) => path.length === 0);
      flowCtx.defineProperty(varName, {
        get: async () => {
          const base = await fetchRecord(topParams, basePaths, preferFullRecord);
          if (!nestedRecords.size) return base;
          const merged: Record<string, unknown> =
            base && typeof base === 'object' && !Array.isArray(base) ? { ...(base as Record<string, unknown>) } : {};
          for (const { params, segments } of nestedRecords.values()) {
            const matchedPaths = usedPaths.filter((path) => startsWithSegments(path, segments));
            if (!matchedPaths.length) continue;
            const relativePaths = matchedPaths.map((path) => path.slice(segments.length));
            let cursor = merged;
            for (const segment of segments.slice(0, -1)) {
              const key = String(segment);
              const child = cursor[key];
              const next =
                child && typeof child === 'object' && !Array.isArray(child)
                  ? { ...(child as Record<string, unknown>) }
                  : {};
              cursor[key] = next;
              cursor = next;
            }
            cursor[String(segments[segments.length - 1])] = fetchRecord(
              params,
              relativePaths,
              relativePaths.some((path) => path.length === 0),
            );
          }
          return merged;
        },
        cache: true,
      });
      continue;
    }

    const usedRecords = [...nestedRecords.values()].filter(({ segments }) =>
      usedPaths.some((path) => startsWithSegments(path, segments)),
    );
    if (!usedRecords.length) continue;
    flowCtx.defineProperty(varName, {
      get: () => {
        const root = new ServerBaseContext();
        const containers = new Map<string, ServerBaseContext>([['[]', root]]);
        for (const { params, segments } of usedRecords.sort((a, b) => a.segments.length - b.segments.length)) {
          const relativePaths = usedPaths
            .filter((path) => startsWithSegments(path, segments))
            .map((path) => path.slice(segments.length));
          if (!relativePaths.length) continue;
          const parentSegments = segments.slice(0, -1);
          let parent = root;
          for (let index = 0; index < parentSegments.length; index++) {
            const path = parentSegments.slice(0, index + 1);
            const cacheKey = JSON.stringify(path);
            let child = containers.get(cacheKey);
            if (!child) {
              child = new ServerBaseContext();
              const childContext = child;
              parent.defineProperty(String(path[path.length - 1]), {
                get: () => childContext.createProxy(),
                cache: true,
              });
              containers.set(cacheKey, child);
            }
            parent = child;
          }
          const key = String(segments[segments.length - 1]);
          parent.defineProperty(key, {
            get: () =>
              fetchRecord(
                params,
                relativePaths,
                relativePaths.some((path) => path.length === 0),
              ),
            cache: true,
          });
        }
        return root.createProxy();
      },
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

      flowCtx.defineProperty('user', {
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
      });
    },
  });

  reg.register({
    name: 'popup',
    scope: 'request',
    allowGenericRecordContext: true,
    attach: () => {
      // Generic record-like contextParams attach popup.record,
      // popup.sourceRecord and popup.parent.* records.
    },
  });
}

// 初始化默认内置变量
registerBuiltInVariables(variables);
