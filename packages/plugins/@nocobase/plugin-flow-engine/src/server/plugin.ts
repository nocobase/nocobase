/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import type { ResourcerContext } from '@nocobase/resourcer';
import { Plugin } from '@nocobase/server';
import { parseLiquidContext, transformSQL } from '@nocobase/utils';
import PluginUISchemaStorageServer from './server';
import { GlobalContext, HttpRequestContext } from './template/contexts';
import { JSONValue, resolveJsonTemplate } from './template/resolver';
import { variables } from './variables/registry';
import { prefetchRecordsForResolve } from './variables/utils';

export class PluginFlowEngineServer extends PluginUISchemaStorageServer {
  private globalContext!: GlobalContext;
  async afterAdd() {}

  async beforeLoad() {
    await super.beforeLoad();
  }

  getDatabaseByDataSourceKey(dataSourceKey = 'main') {
    const dataSource = this.app.dataSourceManager.get(dataSourceKey);
    const cm = dataSource.collectionManager as SequelizeCollectionManager;
    if (!cm.db) {
      throw new Error('no db');
    }
    return cm.db;
  }

  async load() {
    await super.load();
    this.app.auditManager.registerAction('flowSql:save');
    this.app.auditManager.registerAction('flowModels:save');
    this.app.auditManager.registerAction('flowModels:duplicate');
    // Initialize a shared GlobalContext once, using server environment variables
    this.globalContext = new GlobalContext(this.app.environment?.getVariables?.());
    this.app.acl.allow('flowSql', 'runById', 'loggedIn');
    this.app.acl.allow('flowSql', 'getBind', 'loggedIn');
    this.app.acl.allow('variables', 'resolve', 'loggedIn');
    // 赋值动作权限
    this.app.acl.allow('fieldAssignments', 'apply', 'loggedIn');
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
            await prefetchRecordsForResolve(
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
          await prefetchRecordsForResolve(ctx as ResourcerContext, [{ template, contextParams }]);
          const requestCtx = new HttpRequestContext(ctx);
          requestCtx.delegate(this.globalContext);
          await variables.attachUsedVariables(requestCtx, ctx, template, contextParams);
          const resolved = await resolveJsonTemplate(template, requestCtx);
          ctx.body = resolved;
          await next();
        },
      },
    });

    this.app.acl.registerSnippet({
      name: 'ui.flowSql',
      actions: ['flowSql:*'],
    });

    // 字段赋值（批量/单条）后端专用 API 已移除：改为复用 1.0 公共更新接口（collection:update），变量解析走客户端通用逻辑。

    // 兼容：保留部分动作通过 name:action 注册（如 flowSql）
    this.app.resourceManager.registerActionHandlers({
      'flowSql:runById': async (ctx, next) => {
        const { uid, type, filter, bind, liquidContext, dataSourceKey = 'main' } = ctx.action.params.values;
        const r = this.db.getRepository('flowSql');
        const record = await r.findOne({
          filter: { uid },
        });
        const db = this.getDatabaseByDataSourceKey(record.dataSourceKey || dataSourceKey);
        const result = await transformSQL(record.sql);
        const sql = await parseLiquidContext(result.sql, liquidContext);
        ctx.body = await db.runSQL(sql, {
          type,
          filter,
          bind,
        });
        await next();
      },
      'flowSql:getBind': async (ctx, next) => {
        const { uid } = ctx.action.params;
        const r = this.db.getRepository('flowSql');
        const record = await r.findOne({
          filter: { uid },
        });
        const { bind, liquidContext } = await transformSQL(record.sql);
        ctx.body = {
          bind,
          liquidContext,
        };
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
