/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { HttpRequestContext, ServerBaseContext } from '../template/contexts';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import type { TargetKey } from '@nocobase/database';
import { ResourcerContext } from '@nocobase/resourcer';
import { extractUsedVariablePaths } from '@nocobase/utils';
import { adjustSelectsForCollection } from './selects';
import { fetchRecordOrRecordsJson, getExtraKeyFieldsForSelect, mergeFieldsWithExtras } from './records';

export type JSONValue = string | { [key: string]: JSONValue } | JSONValue[];

export type VarScope = 'global' | 'request';

export interface RequiredParamSpec {
  name: string;
  required?: boolean;
  defaultValue?: any;
}

export interface VariableDef {
  name: string; // e.g. 'record'
  scope: VarScope;
  requiredParams?: RequiredParamSpec[]; // for validation
  attach: (ctx: HttpRequestContext, koaCtx: ResourcerContext, params?: any, usage?: VarUsage) => Promise<void> | void;
}

export type VarUsage = {
  // map of variable name -> array of subpaths referenced (e.g. for record: ['roles[0].name','author.company.name'])
  [varName: string]: string[];
};

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

  extractUsage(template: JSONValue): VarUsage {
    // 复用公用工具，保持前后端一致的路径解析/规范化逻辑
    return extractUsedVariablePaths(template) as VarUsage;
  }

  validate(template: JSONValue, contextParams: any): { ok: boolean; missing?: string[] } {
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
    contextParams: any,
  ) {
    const usage = this.extractUsage(template);
    for (const varName of Object.keys(usage)) {
      const def = this.get(varName);
      const params = _.get(contextParams, varName);
      if (def) {
        await def.attach(ctx, koaCtx, params, { [varName]: usage[varName] });
      }
    }

    // After running explicit variable defs, attach generic record-like variables based on contextParams shape.
    attachGenericRecordVariables(ctx, koaCtx, usage, contextParams);
  }
}

/** 变量注册表（全局单例，确保 src/dist 共享同一实例） */
const GLOBAL_KEY = '__ncbVarRegistry__';
const g = (typeof globalThis !== 'undefined' ? globalThis : (global as unknown)) as Record<string, unknown>;
if (!g[GLOBAL_KEY]) {
  g[GLOBAL_KEY] = new VariableRegistry();
}
export const variables: VariableRegistry = g[GLOBAL_KEY] as VariableRegistry;

/** 仅测试使用：重置变量注册表为内置默认集 */
// 注意：测试重置逻辑已迁移至测试工具，避免在实现文件中暴露仅供测试的 API。

/**
 * 从使用路径推断查询所需的 fields 与 appends。
 * @param paths 使用到的子路径数组
 * @param params 显式参数（仅用于兼容签名）
 */
export function inferSelectsFromUsage(
  paths: string[] = [],
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

  for (let path of paths) {
    if (!path) continue;
    // 兼容开头是数字索引（如 [0].name）：移除前导 [n].
    while (/^\[(\d+)\](\.|$)/.test(path)) {
      path = path.replace(/^\[(\d+)\]\.?/, '');
    }
    const norm = normalizePath(path);
    if (!norm) continue;
    const segments = norm.split('.').filter(Boolean);
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
 * 在一次 variables.resolve 调用（或批处理）范围内缓存记录查询结果，减少重复 DB 读。
 * 缓存挂载在 koaCtx.state.__varResolveBatchCache。
 */
async function fetchRecordWithRequestCache(
  koaCtx: ResourcerContext,
  dataSourceKey: string,
  collection: string,
  filterByTk: unknown,
  fields?: string[],
  appends?: string[],
  strictSelects?: boolean,
  preferFullRecord?: boolean,
  associationName?: string,
  sourceId?: unknown,
): Promise<unknown> {
  try {
    const log = koaCtx.app?.logger?.child({
      module: 'plugin-flow-engine',
      submodule: 'variables.resolve',
      method: 'fetchRecordWithRequestCache',
    });
    // 确保 state 与 __varResolveBatchCache 始终存在
    const kctx = koaCtx as ResourcerContext & { state?: Record<string, unknown> };
    if (!kctx.state) kctx.state = {};
    if (!(kctx.state as Record<string, unknown>)['__varResolveBatchCache']) {
      (kctx.state as Record<string, unknown>)['__varResolveBatchCache'] = new Map<string, unknown>();
    }
    const cache = (kctx.state as { __varResolveBatchCache?: Map<string, unknown> }).__varResolveBatchCache || null;
    const ds = koaCtx.app.dataSourceManager.get(dataSourceKey || 'main');
    const cm = ds.collectionManager as SequelizeCollectionManager;
    if (!cm?.db) return undefined;
    const repo =
      associationName && typeof sourceId !== 'undefined'
        ? cm.db.getRepository(associationName, sourceId as TargetKey)
        : cm.db.getRepository(collection);

    // 确保查询字段包含主键（仅当模型存在明确主键且该属性存在于 rawAttributes 中时）
    const modelInfo = (
      repo as unknown as {
        collection?: {
          filterTargetKey?: string | string[];
          model?: { primaryKeyAttribute?: string; rawAttributes?: Record<string, unknown> };
        };
      }
    ).collection?.model;
    const pkAttr = modelInfo?.primaryKeyAttribute;
    const pkIsValid =
      pkAttr && modelInfo?.rawAttributes && Object.prototype.hasOwnProperty.call(modelInfo.rawAttributes, pkAttr);
    const collectionInfo = (repo as unknown as { collection?: { filterTargetKey?: string | string[] } })?.collection;
    const filterTargetKey = collectionInfo?.filterTargetKey;

    // 仅在非 strictSelects 模式下追加 filterTargetKey，用于 filterByTk 数组时“按输入顺序”对齐结果
    // strictSelects=true 场景下尽量不额外扩大选择范围（避免意外解析/覆盖未显式选择的字段）。
    const extraKeys = getExtraKeyFieldsForSelect(filterByTk, {
      filterTargetKey,
      pkAttr,
      pkIsValid,
      rawAttributes: (modelInfo?.rawAttributes as Record<string, unknown>) || undefined,
    });
    const effectiveExtras =
      strictSelects && Array.isArray(extraKeys) && extraKeys.length ? extraKeys.filter((k) => k === pkAttr) : extraKeys;
    const fieldsWithExtras = mergeFieldsWithExtras(fields, effectiveExtras);

    // 对于需要完整记录的场景（preferFullRecord 为 true，例如模板中出现 xxx.record），
    // 缓存键不再区分 fields/appends，只按“全量记录”维度缓存。
    const cacheKeyFields =
      preferFullRecord && pkIsValid
        ? undefined
        : Array.isArray(fieldsWithExtras)
          ? [...fieldsWithExtras].sort()
          : undefined;
    const cacheKeyAppends = preferFullRecord ? undefined : Array.isArray(appends) ? [...appends].sort() : undefined;
    const keyObj: {
      ds: string;
      c: string;
      tk: unknown;
      f?: string[];
      a?: string[];
      full?: boolean;
      assoc?: string;
      sid?: unknown;
    } = {
      ds: dataSourceKey || 'main',
      c: collection,
      tk: filterByTk,
      f: cacheKeyFields,
      a: cacheKeyAppends,
      full: preferFullRecord ? true : undefined,
      assoc: associationName,
      sid: typeof sourceId === 'undefined' ? undefined : sourceId,
    };
    const key = JSON.stringify(keyObj);
    if (cache) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      // 仅当缓存项是本次请求所需 selects 的“超集”时才复用（避免缺字段/关联）。
      // - 对于 preferFullRecord=true 的情况，只要缓存项标记为 full 即可复用（与 fields/appends 无关）。
      // - 对于 strictSelects=true：仅复用“完全相同 key”的缓存（上面已命中）；禁止使用超集复用，避免泄露/覆盖不在选择范围内的字段。
      if (!strictSelects) {
        // 注意：若 needFields 中某路径已被 cachedAppends 的前缀覆盖（例如 needFields: ['roles.name'] 且 cachedAppends: ['roles']），
        // 则认为该字段已被关联载入，可视为满足。
        const needFields =
          !preferFullRecord && Array.isArray(fieldsWithExtras) ? [...new Set(fieldsWithExtras)] : undefined;
        const needAppends = !preferFullRecord && Array.isArray(appends) ? new Set(appends) : undefined;
        for (const [cacheKey, cacheVal] of cache.entries()) {
          const parsed = JSON.parse(cacheKey) as {
            ds: string;
            c: string;
            tk: unknown;
            f?: string[];
            a?: string[];
            full?: boolean;
            assoc?: string;
            sid?: unknown;
          };
          if (
            !parsed ||
            parsed.ds !== keyObj.ds ||
            parsed.c !== keyObj.c ||
            !_.isEqual(parsed.tk, keyObj.tk) ||
            parsed.assoc !== keyObj.assoc ||
            !_.isEqual(parsed.sid, keyObj.sid)
          )
            continue;
          const cachedFields = new Set(parsed.f || []);
          const cachedAppends = new Set(parsed.a || []);

          const fieldCoveredByAppends = (fieldPath: string) => {
            // 归一化，防御空串
            const p = String(fieldPath || '');
            // 若某个 append 是字段路径的前缀，则认为覆盖
            // 例如 append: 'roles' 覆盖 'roles.name' / 'roles.users.id'
            for (const a of cachedAppends) {
              if (!a) continue;
              if (p === a || p.startsWith(a + '.')) return true;
            }
            return false;
          };

          const fieldsOk = needFields
            ? needFields.every((f) => cachedFields.has(f) || fieldCoveredByAppends(f))
            : parsed.f === undefined;
          const appendsOk = !needAppends || [...needAppends].every((a) => cachedAppends.has(a));
          const fullOk = preferFullRecord ? parsed.full === true : true;
          if (fieldsOk && appendsOk && fullOk) {
            return cacheVal;
          }
        }
      }
    }
    // 当 preferFullRecord 为 true 时，无论之前如何推导字段/关联，都以“完整记录”维度查询，
    // 确保 ctx.xxx.record 返回的是完整 JSON 记录，而非仅包含部分字段的切片。
    const json = await fetchRecordOrRecordsJson(repo, {
      filterByTk: filterByTk as TargetKey,
      preferFullRecord,
      fields: fieldsWithExtras,
      appends,
      filterTargetKey,
      pkAttr,
      pkIsValid,
    });
    if (cache) cache.set(key, json);
    return json;
  } catch (e: unknown) {
    const log = koaCtx.app?.logger?.child({
      module: 'plugin-flow-engine',
      submodule: 'variables.resolve',
      method: 'fetchRecordWithRequestCache',
    });
    const errMsg = e instanceof Error ? e.message : String(e);
    log?.warn('[variables.resolve] fetchRecordWithRequestCache error', {
      ds: dataSourceKey,
      collection,
      tk: filterByTk,
      fields,
      appends,
      error: errMsg,
    });
    return undefined;
  }
}

function isRecordParams(val: unknown): val is {
  collection: string;
  filterByTk: unknown;
  dataSourceKey?: string;
  associationName?: string;
  sourceId?: unknown;
  fields?: string[];
  appends?: string[];
} {
  return val && typeof val === 'object' && 'collection' in val && 'filterByTk' in val;
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
  contextParams: any,
) {
  const parseIndexSegment = (segment: string): string | undefined => {
    const m = segment.match(/^\[(\d+)\]$/);
    return m ? m[1] : undefined;
  };
  for (const varName of Object.keys(usage)) {
    const usedPaths = usage[varName] || [];
    const topParams = _.get(contextParams, varName);

    // Deep record params: varName.<a>.<b>[.<c>...] is record (e.g., view.record / popup.parent.record)
    type RecordParams = {
      collection: string;
      filterByTk: unknown;
      dataSourceKey?: string;
      associationName?: string;
      sourceId?: unknown;
      fields?: string[];
      appends?: string[];
    };
    const deepRecordMap = new Map<string, RecordParams>(); // relativePath -> recordParams
    const cp = contextParams;
    if (cp && typeof cp === 'object') {
      const cpRec = cp as Record<string, unknown>;
      for (const key of Object.keys(cpRec)) {
        if (!key || (key !== varName && !key.startsWith(`${varName}.`))) continue;
        if (key === varName) continue;
        const val = cpRec[key];
        if (!isRecordParams(val)) continue;
        const relative = key.slice(varName.length + 1); // e.g. 'parent.record'
        if (!relative) continue;
        deepRecordMap.set(relative, val);
      }
    }

    // Top-level record-like
    if (isRecordParams(topParams)) {
      // If there are deep record params (e.g. contextParams['x.profile'] is a record),
      // exclude those paths from the base record's selects inference to avoid fetching
      // invalid/irrelevant appends on the base collection.
      const usedPathsForBase = deepRecordMap.size
        ? (usedPaths || []).filter((p) => {
            if (!p) return true;
            for (const relative of deepRecordMap.keys()) {
              if (!relative) continue;
              if (p === relative || p.startsWith(relative + '.') || p.startsWith(relative + '[')) return false;
            }
            return true;
          })
        : usedPaths || [];

      const hasDirectRefTop = usedPathsForBase.some((p) => p === '');
      flowCtx.defineProperty(varName, {
        get: async () => {
          const dataSourceKey = topParams?.dataSourceKey || 'main';
          const strictSelects = Array.isArray(topParams?.fields) || Array.isArray(topParams?.appends);
          let { generatedAppends, generatedFields } = inferSelectsFromUsage(usedPathsForBase, topParams);
          if (Array.isArray(topParams?.fields)) generatedFields = topParams.fields;
          if (Array.isArray(topParams?.appends)) generatedAppends = topParams.appends;
          const fixed = adjustSelectsForCollection(
            koaCtx,
            dataSourceKey,
            topParams.collection,
            generatedFields,
            generatedAppends,
          );
          const base = await fetchRecordWithRequestCache(
            koaCtx,
            dataSourceKey,
            topParams.collection,
            topParams.filterByTk,
            fixed.fields,
            fixed.appends,
            strictSelects,
            hasDirectRefTop,
            topParams.associationName,
            topParams.sourceId,
          );
          if (!deepRecordMap.size) return base;

          // Merge: return a shallow-cloned record object with nested record getters injected as Promises.
          // This allows both ctx[varName].field (from base record) and ctx[varName].nested.xxx (from subpath params).
          const merged: any =
            base && typeof base === 'object' && !Array.isArray(base) ? { ...(base as Record<string, any>) } : {};

          const setClonedPath = (obj: Record<string, any>, path: string, value: any) => {
            const segs = String(path || '')
              .split('.')
              .filter(Boolean);
            if (!segs.length) return;
            if (segs.length === 1) {
              obj[segs[0]] = value;
              return;
            }
            let cur: Record<string, any> = obj;
            for (let i = 0; i < segs.length - 1; i++) {
              const seg = segs[i];
              const prev = cur[seg];
              const next = prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...(prev as any) } : {};
              cur[seg] = next;
              cur = next;
            }
            cur[segs[segs.length - 1]] = value;
          };

          const buildNestedPromise = (recordParams: RecordParams, relative: string): Promise<unknown> => {
            const subPaths = (usedPaths || [])
              .map((p) => (p === relative ? '' : p.startsWith(relative + '.') ? p.slice(relative.length + 1) : ''))
              .filter((x) => x !== '');
            const hasDirectRef = (usedPaths || []).some((p) => p === relative);
            const dataSourceKey = recordParams?.dataSourceKey || 'main';
            const strictSelects = Array.isArray(recordParams?.fields) || Array.isArray(recordParams?.appends);
            let { generatedAppends, generatedFields } = inferSelectsFromUsage(subPaths, recordParams);
            if (Array.isArray(recordParams?.fields)) generatedFields = recordParams.fields;
            if (Array.isArray(recordParams?.appends)) generatedAppends = recordParams.appends;
            const fixed = adjustSelectsForCollection(
              koaCtx,
              dataSourceKey,
              recordParams.collection,
              generatedFields,
              generatedAppends,
            );
            return fetchRecordWithRequestCache(
              koaCtx,
              dataSourceKey,
              recordParams.collection,
              recordParams.filterByTk,
              fixed.fields,
              fixed.appends,
              strictSelects,
              hasDirectRef,
              recordParams.associationName,
              recordParams.sourceId,
            );
          };

          for (const [relative, recordParams] of deepRecordMap.entries()) {
            setClonedPath(merged, relative, buildNestedPromise(recordParams, relative));
          }

          return merged;
        },
        cache: true,
      });
      continue; // Top-level record handled (including deepRecordMap merge)
    }

    // Group paths by first segment（支持首段后直接跟数字索引，如 record[0].name）
    const segmentMap = new Map<string, string[]>();
    const splitHead = (path: string): { seg: string; remainder: string } => {
      if (!path) return { seg: '', remainder: '' };
      // 1) 以 [n] 开头（如 [0].name）
      const mIdx = path.match(/^\[(\d+)\](?:\.(.*))?$/);
      if (mIdx) {
        return { seg: `[${mIdx[1]}]`, remainder: mIdx[2] || '' };
      }
      // 2) 标识符开头，后面可能紧跟 [n] 或 .
      const m = path.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(\[(?:\d+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\])?(?:\.(.*))?$/);
      if (m) {
        const seg = m[1];
        const idxPart = m[2] || '';
        const tail = m[3] || '';
        const remainder = (idxPart ? `${idxPart}${tail ? `.${tail}` : ''}` : tail) || '';
        return { seg, remainder };
      }
      // 3) 兜底：按 . 分割
      const [seg, ...rest] = path.split('.');
      return { seg, remainder: rest.join('.') };
    };
    for (const p of usedPaths) {
      if (!p) continue;
      const { seg, remainder } = splitHead(p);
      if (!seg) continue;
      const arr = segmentMap.get(seg) || [];
      arr.push(remainder);
      segmentMap.set(seg, arr);
    }

    // 1) 一层 record：varName.seg 是记录
    const segEntries = Array.from(segmentMap.entries());
    const oneLevelRecordChildren = segEntries.filter(([seg]) => {
      const idx = parseIndexSegment(seg);
      const nestedObj =
        _.get(contextParams, [varName, seg]) ?? (idx ? _.get(contextParams, [varName, idx]) : undefined);
      const dotted =
        (contextParams || {})[`${varName}.${seg}`] ?? (idx ? (contextParams || {})[`${varName}.${idx}`] : undefined);
      return isRecordParams(nestedObj) || isRecordParams(dotted);
    });

    if (!oneLevelRecordChildren.length && deepRecordMap.size === 0) continue;

    flowCtx.defineProperty(varName, {
      get: () => {
        const root = new ServerBaseContext();
        const definedFirstLevel = new Set<string>();

        // Helper: define a record getter at container with given key
        const defineRecordGetter = (
          container: ServerBaseContext,
          key: string,
          recordParams: {
            collection: string;
            filterByTk: unknown;
            dataSourceKey?: string;
            associationName?: string;
            sourceId?: unknown;
            fields?: string[];
            appends?: string[];
          },
          subPaths: string[] = [],
          preferFull?: boolean,
        ) => {
          const strictSelects = Array.isArray(recordParams?.fields) || Array.isArray(recordParams?.appends);
          let { generatedAppends, generatedFields } = inferSelectsFromUsage(subPaths, recordParams);
          if (Array.isArray(recordParams?.fields)) generatedFields = recordParams.fields;
          if (Array.isArray(recordParams?.appends)) generatedAppends = recordParams.appends;
          container.defineProperty(key, {
            get: async () => {
              const dataSourceKey = recordParams?.dataSourceKey || 'main';
              const fixed = adjustSelectsForCollection(
                koaCtx,
                dataSourceKey,
                recordParams.collection,
                generatedFields,
                generatedAppends,
              );
              return await fetchRecordWithRequestCache(
                koaCtx,
                dataSourceKey,
                recordParams.collection,
                recordParams.filterByTk,
                fixed.fields,
                fixed.appends,
                strictSelects,
                preferFull || (subPaths?.length ?? 0) === 0,
                recordParams.associationName,
                recordParams.sourceId,
              );
            },
            cache: true,
          });
        };

        // Helper: get or create sub container under ctx with given key
        const subContainers = new Map<ServerBaseContext, Map<string, ServerBaseContext>>();
        const ensureSubContainer = (parent: ServerBaseContext, key: string): ServerBaseContext => {
          let map = subContainers.get(parent);
          if (!map) {
            map = new Map();
            subContainers.set(parent, map);
          }
          let child = map.get(key);
          if (!child) {
            const inst = new ServerBaseContext();
            parent.defineProperty(key, { get: () => inst.createProxy(), cache: true });
            map.set(key, inst);
            child = inst;
          }
          return child;
        };

        // First: handle one-level record children (varName.seg)
        for (const [seg, remainders] of oneLevelRecordChildren) {
          const idx = parseIndexSegment(seg);
          const recordParams =
            _.get(contextParams, [varName, seg]) ??
            (idx ? _.get(contextParams, [varName, idx]) : undefined) ??
            (contextParams || {})[`${varName}.${seg}`] ??
            (idx ? (contextParams || {})[`${varName}.${idx}`] : undefined);

          let effRemainders = (remainders || []).filter((r) => !!r);
          if (!effRemainders.length) {
            const all = usedPaths
              .map((p) =>
                p.startsWith(`${seg}.`) ? p.slice(seg.length + 1) : p.startsWith(`${seg}[`) ? p.slice(seg.length) : '',
              )
              .filter((x) => !!x);
            if (all.length) effRemainders = all;
          }

          const hasDirectRefOne = (usedPaths || []).some((p) => p === seg || (!!idx && p === `[${idx}]`));
          defineRecordGetter(root, idx ?? seg, recordParams, effRemainders, hasDirectRefOne);
          definedFirstLevel.add(idx ?? seg);
        }

        // Then: handle deep record children (varName.a.b[.c...])
        for (const [relative, recordParams] of deepRecordMap.entries()) {
          const segs = String(relative).split('.').filter(Boolean);
          if (segs.length === 0) continue;
          const first = segs[0];
          // Ensure first-level container exists, but avoid overriding previously defined first-level record getters
          let container: ServerBaseContext;
          if (definedFirstLevel.has(first)) {
            // 已定义为 record getter 的一层 key，无法作为容器复用；跳过（由上层 one-level 逻辑覆盖）。
            continue;
          } else {
            container = root;
            for (let i = 0; i < segs.length - 1; i++) {
              container = ensureSubContainer(container, segs[i]);
            }
          }

          const leaf = segs[segs.length - 1];
          // 计算该记录下的使用子路径（相对 relative）
          const subPaths = (usedPaths || [])
            .map((p) => (p === relative ? '' : p.startsWith(relative + '.') ? p.slice(relative.length + 1) : ''))
            .filter((x) => x !== '');
          const hasDirectRef = (usedPaths || []).some((p) => p === relative);
          defineRecordGetter(container, leaf, recordParams, subPaths, hasDirectRef);
        }

        return root.createProxy();
      },
      cache: true,
    });
  }
}

function registerBuiltInVariables(reg: VariableRegistry) {
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
    attach: (flowCtx, koaCtx, _params, usage) => {
      const paths = usage?.['user'] || [];
      const { generatedAppends, generatedFields } = inferSelectsFromUsage(paths);

      flowCtx.defineProperty('user', {
        get: async () => {
          const authObj = (koaCtx as ResourcerContext & { auth?: { user?: { id?: unknown } } }).auth;
          const uid = authObj?.user?.id;
          if (typeof uid === 'undefined' || uid === null) return undefined;
          return await fetchRecordWithRequestCache(
            koaCtx,
            'main',
            'users',
            uid,
            generatedFields,
            generatedAppends,
            false,
            undefined,
            undefined,
            undefined,
          );
        },
        cache: true,
      });
    },
  });
}

// 初始化默认内置变量
registerBuiltInVariables(variables);
