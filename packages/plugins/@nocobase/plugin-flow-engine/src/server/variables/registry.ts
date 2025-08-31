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

import type { Context } from '@nocobase/actions';
import _ from 'lodash';
import { HttpRequestContext } from '../template/contexts';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';

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
  attach: (ctx: HttpRequestContext, koaCtx: Context, params?: any, usage?: VarUsage) => Promise<void> | void;
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
              }
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
              }
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

  validate(
    template: JSONValue,
    contextParams: any,
  ): { ok: boolean; missing?: string[] } {
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

  async attachUsedVariables(ctx: HttpRequestContext, koaCtx: Context, template: JSONValue, contextParams: any) {
    const usage = this.extractUsage(template);
    for (const varName of Object.keys(usage)) {
      const def = this.get(varName);
      if (!def) continue;
      const params = _.get(contextParams, varName);
      await def.attach(ctx, koaCtx, params, { [varName]: usage[varName] });
    }
  }
}

export const variables = new VariableRegistry();

// Built-ins: record
variables.register({
  name: 'record',
  scope: 'request',
  requiredParams: [
    { name: 'collection', required: true },
    { name: 'filterByTk', required: true },
    { name: 'dataSourceKey', required: false, defaultValue: 'main' },
    { name: 'fields', required: false },
    { name: 'appends', required: false },
  ],
  attach: (flowCtx, koaCtx, params, usage) => {
    // generate appends from usage if not provided: first segment after record.
    let generatedAppends: string[] | undefined;
    let generatedFields: string[] | undefined;
    const paths = usage?.record || [];
    if (!params?.appends && Array.isArray(paths) && paths.length > 0) {
      const set = new Set<string>();
      for (const p of paths) {
        const seg = p.split(/\.|\[/)[0]; // 'roles[0].name' -> 'roles'
        if (seg && seg !== 'id') set.add(seg);
      }
      if (set.size > 0) generatedAppends = Array.from(set);
    }
    if (!params?.fields && Array.isArray(paths) && paths.length > 0) {
      const fieldSet = new Set<string>(['id']);
      for (const p of paths) {
        // collect top-level scalars, e.g., 'name' from 'name' (no further dot/bracket)
        if (!p.includes('.') && !p.includes('[')) {
          const seg = p.split(/\.|\[/)[0];
          if (seg) fieldSet.add(seg);
        }
      }
      if (fieldSet.size > 0) generatedFields = Array.from(fieldSet);
    }

    flowCtx.defineProperty('record', {
      get: async () => {
        // explicit params
        if (params?.collection && typeof params?.filterByTk !== 'undefined') {
          const dataSourceKey = params?.dataSourceKey || 'main';
          const ds = koaCtx.app.dataSourceManager.get(dataSourceKey);
          const cm = ds.collectionManager as SequelizeCollectionManager;
          if (!cm?.db) return undefined;
          const repo = cm.db.getRepository(params.collection);
          const rec = await repo.findOne({
            filterByTk: params.filterByTk,
            fields: params.fields || generatedFields,
            appends: params.appends || generatedAppends,
          });
          return rec ? rec.toJSON() : undefined;
        }
        // missing explicit params -> do not fallback; validation should block earlier
        return undefined;
      },
      cache: true,
    });
  },
});

// Built-ins: parentRecord (fetch by explicit params only)
(['parentRecord', 'popupRecord', 'parentPopupRecord'] as const).forEach((varName) => {
  variables.register({
    name: varName,
    scope: 'request',
    requiredParams: [
      { name: 'collection', required: true },
      { name: 'filterByTk', required: true },
      { name: 'dataSourceKey', required: false, defaultValue: 'main' },
      { name: 'fields', required: false },
      { name: 'appends', required: false },
    ],
    attach: (flowCtx, koaCtx, params, usage) => {
      // generate appends from usage if not provided: first segment after varName.
      let generatedAppends: string[] | undefined;
      let generatedFields: string[] | undefined;
      const paths = usage?.[varName] || [];
      if (!params?.appends && Array.isArray(paths) && paths.length > 0) {
        const set = new Set<string>();
        for (const p of paths) {
          const seg = p.split(/\.|\[/)[0];
          if (seg && seg !== 'id') set.add(seg);
        }
        if (set.size > 0) generatedAppends = Array.from(set);
      }
      if (!params?.fields && Array.isArray(paths) && paths.length > 0) {
        const fieldSet = new Set<string>(['id']);
        for (const p of paths) {
          if (!p.includes('.') && !p.includes('[')) {
            const seg = p.split(/\.|\[/)[0];
            if (seg) fieldSet.add(seg);
          }
        }
        if (fieldSet.size > 0) generatedFields = Array.from(fieldSet);
      }

      flowCtx.defineProperty(varName, {
        get: async () => {
          if (params?.collection && typeof params?.filterByTk !== 'undefined') {
            const dataSourceKey = params?.dataSourceKey || 'main';
            const ds = koaCtx.app.dataSourceManager.get(dataSourceKey);
            const cm = ds.collectionManager as SequelizeCollectionManager;
            if (!cm?.db) return undefined;
            const repo = cm.db.getRepository(params.collection);
            const rec = await repo.findOne({
              filterByTk: params.filterByTk,
              fields: params.fields || generatedFields,
              appends: params.appends || generatedAppends,
            });
            return rec ? rec.toJSON() : undefined;
          }
          return undefined;
        },
        cache: true,
      });
    },
  });
});
