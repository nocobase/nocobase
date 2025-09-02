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

/** 变量注册表（全局单例） */
export const variables = new VariableRegistry();

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

  for (const p of paths) {
    const seg = p.split(/\.|\[/)[0];
    if (!seg) continue;
    // Nested access implies association/append (e.g. roles[0].name or author.company)
    if (p.includes('.') || p.includes('[')) {
      appendSet.add(seg);
    } else {
      // Top-level path implies base field selection
      fieldSet.add(seg);
    }
  }

  const generatedAppends = appendSet.size ? Array.from(appendSet) : undefined;
  const generatedFields = fieldSet.size ? Array.from(fieldSet) : undefined;
  return { generatedAppends, generatedFields };
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
          const ds = koaCtx.app.dataSourceManager.get(dataSourceKey);
          const cm = ds.collectionManager as SequelizeCollectionManager;
          if (!cm?.db) return undefined;
          const repo = cm.db.getRepository(topParams.collection);
          const rec = await repo.findOne({
            filterByTk: topParams.filterByTk,
            fields: generatedFields,
            appends: generatedAppends,
          });
          return rec ? rec.toJSON() : undefined;
        },
        cache: true,
      });
      continue; // If top-level is record, nested processing under same varName is unnecessary
    }

    // Nested record-like under varName
    // Group paths by first segment
    const segMap = new Map<string, string[]>();
    for (const p of usedPaths) {
      if (!p) continue;
      const [seg, ...rest] = p.split('.');
      if (!seg) continue;
      const remainder = rest.join('.') || '';
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
          const { generatedAppends, generatedFields } = inferSelectsFromUsage(
            remainders.filter((r) => !!r), // use sub-paths under seg
            rp,
          );
          const defKey = idx ?? seg; // define numeric index for [0] so lodash.get '[0]' resolves to '0'
          sub.defineProperty(defKey, {
            get: async () => {
              const dataSourceKey = rp?.dataSourceKey || 'main';
              const ds = koaCtx.app.dataSourceManager.get(dataSourceKey);
              const cm = ds.collectionManager as SequelizeCollectionManager;
              if (!cm?.db) return undefined;
              const repo = cm.db.getRepository(rp.collection);
              const rec = await repo.findOne({
                filterByTk: rp.filterByTk,
                fields: generatedFields,
                appends: generatedAppends,
              });
              return rec ? rec.toJSON() : undefined;
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

/**
 * Register `user` variable:
 * - No contextParams required or expected from client.
 * - Infers fields/appends from usage paths (e.g. ctx.user.roles[0].name -> appends: ['roles']).
 * - Loads current user from DB by primary key in koaCtx.auth.user.id.
 */
variables.register({
  name: 'user',
  scope: 'request',
  // no requiredParams: frontend will not pass context params for user
  attach: (flowCtx, koaCtx, _params, usage) => {
    const paths = usage?.['user'] || [];
    const { generatedAppends, generatedFields } = inferSelectsFromUsage(paths);

    flowCtx.defineProperty('user', {
      get: async () => {
        const uid = (koaCtx as any)?.auth?.user?.id;
        if (typeof uid === 'undefined' || uid === null) return undefined;

        const ds = koaCtx.app.dataSourceManager.get('main');
        const cm = ds.collectionManager as SequelizeCollectionManager;
        if (!cm?.db) return undefined;
        const repo = cm.db.getRepository('users');
        const rec = await repo.findOne({
          filterByTk: uid,
          fields: generatedFields,
          appends: generatedAppends,
        });
        return rec ? rec.toJSON() : undefined;
      },
      cache: true,
    });
  },
});
