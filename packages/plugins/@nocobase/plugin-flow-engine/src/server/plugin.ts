/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Plugin } from '@nocobase/server';
import { GlobalContext, HttpRequestContext } from './template/contexts';
import { resolveJsonTemplate, JSONValue } from './template/resolver';
import { variables } from './variables/registry';
import type { ResourcerContext } from '@nocobase/resourcer';

export class PluginFlowEngineServer extends Plugin {
  private globalContext!: GlobalContext;
  async afterAdd() {}

  async beforeLoad() {}

  getDatabaseByDataSourceKey(dataSourceKey = 'main') {
    const dataSource = this.app.dataSourceManager.get(dataSourceKey);
    const cm = dataSource.collectionManager as SequelizeCollectionManager;
    if (!cm.db) {
      throw new Error('no db');
    }
    return cm.db;
  }

  // 预取：构建“同记录”的字段/关联并集，一次查询写入 ctx.state.__varResolveBatchCache，供后续解析复用
  private async prefetchRecordsForResolve(
    koaCtx: ResourcerContext,
    items: Array<{ template: JSONValue; contextParams?: Record<string, unknown> }>,
  ) {
    try {
      const groupMap = new Map<
        string,
        { ds: string; collection: string; tk: unknown; fields: Set<string>; appends: Set<string> }
      >();
      const ensureGroup = (ds: string, collection: string, tk: unknown) => {
        const gk = JSON.stringify({ ds, collection, tk });
        let g = groupMap.get(gk);
        if (!g) {
          g = { ds, collection, tk, fields: new Set<string>(), appends: new Set<string>() };
          groupMap.set(gk, g);
        }
        return g;
      };
      const normalizeNestedSeg = (seg: string): string => (/^\d+$/.test(seg) ? `[${seg}]` : seg);
      const toFirstSeg = (path: string): { seg: string; hasDeep: boolean } => {
        const m = path.match(/^([^.[]+|\[[^\]]+\])([\s\S]*)$/);
        const seg = m ? m[1] : '';
        const rest = m ? m[2] : '';
        return { seg, hasDeep: rest.includes('.') || rest.includes('[') || rest.length > 0 };
      };
      for (const it of items) {
        const template = it?.template ?? {};
        const contextParams = (it?.contextParams || {}) as Record<string, any>;
        const usage = variables.extractUsage(template);
        for (const [cpKey, rp] of Object.entries(contextParams)) {
          const parts = String(cpKey).split('.');
          const varName = parts[0];
          const nestedSeg = parts.slice(1).join('.');
          const paths = usage?.[varName] || [];
          if (!paths.length) continue;
          const segNorm = nestedSeg ? normalizeNestedSeg(nestedSeg) : '';
          const remainders: string[] = [];
          for (const p of paths) {
            if (!segNorm) remainders.push(p);
            else if (p === segNorm) remainders.push('');
            else if (p.startsWith(`${segNorm}.`) || p.startsWith(`${segNorm}[`))
              remainders.push(p.slice(segNorm.length + 1));
          }
          if (!remainders.length) continue;
          const ds = (rp as any)?.dataSourceKey || 'main';
          const collection = (rp as any)?.collection;
          const tk = (rp as any)?.filterByTk;
          if (!collection || typeof tk === 'undefined') continue;
          const g = ensureGroup(ds, collection, tk);
          for (const r of remainders) {
            const { seg, hasDeep } = toFirstSeg(r);
            if (!seg) continue;
            const key = seg.replace(/^\[(.+)\]$/, '$1');
            if (hasDeep) g.appends.add(key);
            else g.fields.add(key);
          }
        }
      }
      if (!groupMap.size) return;
      const stateObj = (koaCtx as any).state as Record<string, any>;
      if (stateObj && !stateObj['__varResolveBatchCache']) {
        stateObj['__varResolveBatchCache'] = new Map<string, unknown>();
      }
      const cache: Map<string, unknown> | undefined = (koaCtx as any).state?.['__varResolveBatchCache'];
      for (const { ds, collection, tk, fields, appends } of groupMap.values()) {
        try {
          const dataSource = this.app.dataSourceManager.get(ds);
          const cm = dataSource.collectionManager as SequelizeCollectionManager;
          if (!cm?.db) continue;
          const repo = cm.db.getRepository(collection);
          const fld = fields.size ? Array.from(fields) : undefined;
          const app = appends.size ? Array.from(appends) : undefined;
          const rec = await repo.findOne({ filterByTk: tk as any, fields: fld, appends: app });
          const json = rec ? rec.toJSON() : undefined;
          if (cache) {
            const key = JSON.stringify({ ds, c: collection, tk, f: fld, a: app });
            cache.set(key, json);
          }
        } catch {
          // ignore prefetch error
        }
      }
    } catch {
      // ignore prefetch failure entirely
    }
  }

  async load() {
    // Initialize a shared GlobalContext once, using server environment variables
    this.globalContext = new GlobalContext(this.app.environment?.getVariables?.());
    this.app.acl.allow('flowSql', 'runById', 'loggedIn');
    this.app.acl.allow('variables', 'resolve', 'loggedIn');
    // 定义资源与动作
    this.app.resourceManager.define({
      name: 'variables',
      actions: {
        // 解析 JSON 模板中的 ctx 变量
        resolve: async (ctx, next) => {
          // 仅保留两种提交方式：
          // 1) values.batch: [{ id?, template, contextParams }]
          // 2) values.template + values.contextParams
          const raw = ctx.action?.params?.values ?? {};
          const values = typeof raw?.values !== 'undefined' ? raw.values : raw;

          // 批量解析分支
          if (Array.isArray(values?.batch)) {
            const batchItems = values.batch as Array<{
              id?: string | number;
              template: JSONValue;
              contextParams?: Record<string, unknown>;
            }>;
            await this.prefetchRecordsForResolve(
              ctx as ResourcerContext,
              batchItems.map((it) => ({
                template: it.template,
                contextParams: (it.contextParams || {}) as Record<string, unknown>,
              })),
            );
            const results: Array<{ id?: string | number; data: unknown }> = [];
            for (const item of batchItems) {
              const template = item?.template ?? {};
              const contextParams = item?.contextParams || {};
              const requestCtx = new HttpRequestContext(ctx);
              requestCtx.delegate(this.globalContext);
              await variables.attachUsedVariables(requestCtx, ctx, template, contextParams);
              const resolved = await resolveJsonTemplate(template, requestCtx);
              results.push({ id: item?.id, data: resolved });
            }
            ctx.body = { results };
            await next();
            return;
          }

          // 单条解析分支
          if (typeof values?.template === 'undefined') {
            ctx.throw(400, {
              code: 'INVALID_PAYLOAD',
              message: 'values.template is required when batch is not provided',
            });
          }
          const template = values.template as JSONValue;
          const contextParams = values?.contextParams || {};
          await this.prefetchRecordsForResolve(ctx as ResourcerContext, [{ template, contextParams }]);
          const requestCtx = new HttpRequestContext(ctx);
          requestCtx.delegate(this.globalContext);
          await variables.attachUsedVariables(requestCtx, ctx, template, contextParams);
          const resolved = await resolveJsonTemplate(template, requestCtx);
          ctx.body = resolved;
          await next();
        },
      },
    });

    // 兼容：保留部分动作通过 name:action 注册（如 flowSql）
    this.app.resourceManager.registerActionHandlers({
      'flowSql:runById': async (ctx, next) => {
        const { uid, type, filter, bind, dataSourceKey = 'main' } = ctx.action.params.values;
        const r = this.db.getRepository('flowSql');
        const record = await r.findOne({
          filter: { uid },
        });
        const db = this.getDatabaseByDataSourceKey(record.dataSourceKey || dataSourceKey);
        ctx.body = await db.runSQL(record.sql, { type, filter, bind });
        await next();
      },
      'flowSql:save': async (ctx, next) => {
        const { uid, sql, dataSourceKey } = ctx.action.params.values;
        const r = this.db.getRepository('flowSql');
        await r.updateOrCreate({
          filterKeys: ['uid'],
          values: { uid, sql, dataSourceKey },
        });
        ctx.body = 'ok';
        await next();
      },
      'flowSql:run': async (ctx, next) => {
        const { sql, type, filter, bind, dataSourceKey } = ctx.action.params.values;
        const db = this.getDatabaseByDataSourceKey(dataSourceKey);
        ctx.body = await db.runSQL(sql, { type, filter, bind });
        await next();
      },
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFlowEngineServer;
