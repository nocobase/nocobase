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
import { resolveJsonTemplate } from './template/resolver';
import { variables } from './variables/registry';

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
          // 兼容两种提交方式：
          // 1) 直接将整个 values 当作模板
          // 2) 将模板放在 values.template 下
          // 同时兼容 resourcer 的包裹（会把 body 再包到 params.values 下）
          const raw = ctx.action?.params?.values ?? {};
          const values = typeof raw?.values !== 'undefined' ? raw.values : raw;
          const template = typeof values?.template !== 'undefined' ? values.template : values;
          const contextParams = values?.contextParams || {};
          const { ok, missing } = variables.validate(template, contextParams);
          if (!ok) {
            ctx.throw(400, {
              code: 'INVALID_CONTEXT_PARAMS',
              message: `Missing required parameters: ${missing?.join(', ')}`,
              missing,
            });
          }

          const requestCtx = new HttpRequestContext(ctx);
          requestCtx.delegate(this.globalContext);
          await variables.attachUsedVariables(requestCtx, ctx, template, contextParams);
          const resolved = await resolveJsonTemplate(template, requestCtx);
          ctx.body = { data: resolved };
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
