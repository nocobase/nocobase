/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * Dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 */
import _ from 'lodash';
import { HttpRequestContext, ServerBaseContext } from '../template/contexts';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { ResourcerContext } from '@nocobase/resourcer';

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
    const usage: VarUsage = {};
    const visit = (src: any) => {
      if (typeof src === 'string') {
        const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(src)) !== null) {
          const expr = m[1];
          // capture ctx.<var>(.<path>|[...])*
          const pathRegex = /ctx\.([a-zA-Z_$][a-zA-Z0-9_$]*)([^\s)]*)/g;
          let pm: RegExpExecArray | null;
          while ((pm = pathRegex.exec(expr)) !== null) {
            const varName = pm[1];
            const after = pm[2] || '';
            usage[varName] = usage[varName] || [];
            if (after.startsWith('.')) {
              usage[varName].push(after.slice(1));
            } else if (after.startsWith('[')) {
              // Normalize bracket string key: ctx.record["roles"][0].name -> roles[0].name
              const mm = after.match(/^\[\s*(['"])\s*([^'"\]]+)\s*\1\s*\](.*)$/);
              if (mm) {
                const first = mm[2];
                const rest = mm[3] || '';
                usage[varName].push(`${first}${rest}`);
              } else {
                // Numeric index: ctx.list[0].name -> [0].name
                const mn = after.match(/^\[(\d+)\](.*)$/);
                if (mn) {
                  const idx = mn[1];
                  const rest = mn[2] || '';
                  usage[varName].push(`[${idx}]${rest}`);
                }
              }
            } else if (after.startsWith('(')) {
              // method call: ctx.twice(21) -> record usage to trigger attach
              if (!usage[varName].length) usage[varName].push('');
            }
          }
          // also capture top-level bracket var: ctx["record"].roles[0].name
          const bracketVarRegex = /ctx\[\s*(["'])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\1\s*\]([^\s)]*)/g;
          let bm: RegExpExecArray | null;
          while ((bm = bracketVarRegex.exec(expr)) !== null) {
            const varName = bm[2];
            const after = bm[3] || '';
            usage[varName] = usage[varName] || [];
            if (after.startsWith('.')) {
              usage[varName].push(after.slice(1));
            } else if (after.startsWith('[')) {
              const mm = after.match(/^\[\s*(['"])\s*([^'"\]]+)\s*\1\s*\](.*)$/);
              if (mm) {
                const first = mm[2];
                const rest = mm[3] || '';
                usage[varName].push(`${first}${rest}`);
              } else {
                const mn = after.match(/^\[(\d+)\](.*)$/);
                if (mn) {
                  const idx = mn[1];
                  const rest = mn[2] || '';
                  usage[varName].push(`[${idx}]${rest}`);
                }
              }
            } else if (after.startsWith('(')) {
              if (!usage[varName].length) usage[varName].push('');
            }
          }
        }
      } else if (Array.isArray(src)) {
        src.forEach(visit);
      } else if (src && typeof src === 'object') {
        Object.values(src).forEach(visit);
      }
    };
    visit(template);
    return usage;
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
const g: any = typeof globalThis !== 'undefined' ? globalThis : (global as any);
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
function inferSelectsFromUsage(paths: string[] = [], params?: any) {
  if (!Array.isArray(paths) || paths.length === 0) {
    return { generatedAppends: undefined, generatedFields: undefined };
  }

  const appendSet = new Set<string>();
  const fieldSet = new Set<string>();

  for (let p of paths) {
    if (!p) continue;
    // 若以数字索引开头（如 [0].name），去掉前导的 [n].，用于推断字段/关联
    // 这样 record[0].name 的子路径（传入本函数时为 [0].name）会被识别为字段 name，而非关联
    while (/^\[(\d+)\](\.|$)/.test(p)) {
      p = p.replace(/^\[(\d+)\]\.?/, '');
    }
    if (!p) continue;
    // 若以字符串括号开头（如 ['name'] 或 ["name"])，将其作为首段字段名处理
    let first = '';
    let rest = '';
    const mStr = p.match(/^\[(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')\](.*)$/);
    if (mStr) {
      first = (mStr[1] ?? mStr[2]) || '';
      rest = mStr[3] || '';
    } else {
      // 字符类中 '.' 和 '[' 无需转义，避免 no-useless-escape
      const m = p.match(/^([^.[]+)([\s\S]*)$/);
      first = m?.[1] ?? '';
      rest = m?.[2] ?? '';
    }
    if (!first) continue;
    const hasDeep = rest.includes('.') || rest.includes('[');
    if (hasDeep) appendSet.add(first);
    else fieldSet.add(first);
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
): Promise<unknown> {
  try {
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
    const repo = cm.db.getRepository(collection);

    const keyObj: { ds: string; c: string; tk: unknown; f?: string[]; a?: string[] } = {
      ds: dataSourceKey || 'main',
      c: collection,
      tk: filterByTk,
      f: Array.isArray(fields) ? [...fields].sort() : undefined,
      a: Array.isArray(appends) ? [...appends].sort() : undefined,
    };
    const key = JSON.stringify(keyObj);
    if (cache) {
      // 精确命中
      if (cache.has(key)) return cache.get(key);
      // 仅当缓存项是本次请求所需 selects 的“超集”时才复用（避免缺字段/关联）
      const needFields = Array.isArray(fields) ? new Set(fields) : undefined;
      const needAppends = Array.isArray(appends) ? new Set(appends) : undefined;
      let fallbackAny: unknown = undefined;
      for (const [ck, cv] of cache.entries()) {
        const parsed = JSON.parse(ck) as { ds: string; c: string; tk: unknown; f?: string[]; a?: string[] };
        if (!parsed || parsed.ds !== keyObj.ds || parsed.c !== keyObj.c || parsed.tk !== keyObj.tk) continue;
        const cachedFields = Array.isArray(parsed.f) ? new Set(parsed.f) : undefined;
        const cachedAppends = Array.isArray(parsed.a) ? new Set(parsed.a) : undefined;
        const fieldsOk = !needFields || (cachedFields && [...needFields].every((x) => cachedFields.has(x)));
        const appendsOk = !needAppends || (cachedAppends && [...needAppends].every((x) => cachedAppends.has(x)));
        if (fieldsOk && appendsOk) return cv;
        // 兜底：记住同 ds/c/tk 的任意缓存，若无“超集”匹配则使用它（prefetch 已保证并集）
        if (typeof fallbackAny === 'undefined') fallbackAny = cv;
      }
      if (typeof fallbackAny !== 'undefined') return fallbackAny;
    }
    const tk: any = filterByTk as any;
    const rec = await repo.findOne({
      filterByTk: tk,
      fields,
      appends,
    });
    const json = rec ? rec.toJSON() : undefined;
    if (cache) cache.set(key, json);
    return json;
  } catch (_) {
    return undefined;
  }
}

function isRecordParams(val: any): val is { collection: string; filterByTk: any; dataSourceKey?: string } {
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
  const parseIndexSeg = (seg: string): string | undefined => {
    const m = seg.match(/^\[(\d+)\]$/);
    return m ? m[1] : undefined;
  };
  for (const varName of Object.keys(usage)) {
    const usedPaths = usage[varName] || [];
    const topParams = _.get(contextParams, varName);

    // Top-level record-like
    if (isRecordParams(topParams)) {
      const { generatedAppends, generatedFields } = inferSelectsFromUsage(usedPaths, topParams);
      flowCtx.defineProperty(varName, {
        get: async () => {
          const dataSourceKey = topParams?.dataSourceKey || 'main';
          return await fetchRecordWithRequestCache(
            koaCtx,
            dataSourceKey,
            topParams.collection,
            topParams.filterByTk,
            generatedFields,
            generatedAppends,
          );
        },
        cache: true,
      });
      continue; // If top-level is record, nested processing under same varName is unnecessary
    }

    // Nested record-like under varName
    // Group paths by first segment（支持首段后直接跟数字索引，如 record[0].name）
    const segMap = new Map<string, string[]>();
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
        // 若紧跟 [n]，则把 [n] 保留到 remainder 中，seg 仅为标识符本体
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
      const arr = segMap.get(seg) || [];
      arr.push(remainder);
      segMap.set(seg, arr);
    }

    // Build a container sub-context lazily only if any child is record-like
    const segEntries = Array.from(segMap.entries());
    const recordChildren = segEntries.filter(([seg]) => {
      const idx = parseIndexSeg(seg);
      const nestedObj =
        _.get(contextParams, [varName, seg]) ?? (idx ? _.get(contextParams, [varName, idx]) : undefined);
      const dotted =
        (contextParams || {})[`${varName}.${seg}`] ?? (idx ? (contextParams || {})[`${varName}.${idx}`] : undefined);
      return isRecordParams(nestedObj) || isRecordParams(dotted);
    });
    if (!recordChildren.length) continue;

    flowCtx.defineProperty(varName, {
      get: () => {
        const sub = new ServerBaseContext();
        for (const [seg, remainders] of recordChildren) {
          const idx = parseIndexSeg(seg);
          const rp =
            _.get(contextParams, [varName, seg]) ??
            (idx ? _.get(contextParams, [varName, idx]) : undefined) ??
            (contextParams || {})[`${varName}.${seg}`] ??
            (idx ? (contextParams || {})[`${varName}.${idx}`] : undefined);
          // 优先使用本段的子路径；若解析不到任何子路径，则尝试从原始 usedPaths 回退计算一次（去掉首段 `${seg}.`）
          let effRemainders = remainders.filter((r) => !!r);
          if (!effRemainders.length) {
            const all = usedPaths
              .map((p) =>
                p.startsWith(`${seg}.`) ? p.slice(seg.length + 1) : p.startsWith(`${seg}[`) ? p.slice(seg.length) : '',
              )
              .filter((x) => !!x);
            if (all.length) effRemainders = all;
          }
          const { generatedAppends, generatedFields } = inferSelectsFromUsage(effRemainders, rp);
          const defKey = idx ?? seg; // define numeric index for [0] so lodash.get '[0]' resolves to '0'
          sub.defineProperty(defKey, {
            get: async () => {
              const dataSourceKey = rp?.dataSourceKey || 'main';
              return await fetchRecordWithRequestCache(
                koaCtx,
                dataSourceKey,
                rp.collection,
                rp.filterByTk,
                generatedFields,
                generatedAppends,
              );
            },
            cache: true,
          });
        }
        return sub.createProxy();
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
          return await fetchRecordWithRequestCache(koaCtx, 'main', 'users', uid, generatedFields, generatedAppends);
        },
        cache: true,
      });
    },
  });
}

// 初始化默认内置变量
registerBuiltInVariables(variables);
