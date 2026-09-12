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
import type { Application } from '@nocobase/server';
import { parseLiquidContext, transformSQL } from '@nocobase/utils';
import { registerFlowSurfacesResource } from './flow-surfaces';
import PluginUISchemaStorageServer from './server';
import { JSONValue } from './template/resolver';
import type { AnalyzedTemplate, ResolvePathPolicy } from './template/variable-expression';
import { authorizeVariablesResolve } from './variables/allow-list';
import type { RecordBindingPlan } from './variables/record-bindings';
import { createFormItemRecordSlotResolvers } from './variables/form-item-record-slot-resolvers';
import { createBuiltInRecordSlotResolvers } from './variables/record-slot-policy';
import { getRecordSlotResolverRegistry } from './variables/record-slot-resolvers';
import {
  isLegacyVariableTemplateSafe,
  resolveAnalyzedVariablesBatch,
  resolveAnalyzedVariablesTemplate,
  resolveFlowModelVariablesTemplate,
} from './variables/resolve';

export class PluginFlowEngineServer extends PluginUISchemaStorageServer {
  private recordSlotResolverDisposers: Array<() => void> = [];

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

  async runSQLByDataSourceKey(dataSourceKey: string | undefined, sql: string, options: Record<string, unknown> = {}) {
    const key = dataSourceKey || 'main';
    const dataSource = this.app.dataSourceManager.get(key);
    if (!dataSource) {
      throw new Error(`data source "${key}" does not exist`);
    }

    const cm = dataSource.collectionManager as SequelizeCollectionManager;

    if (typeof cm.db?.runSQL !== 'function') {
      throw new Error(`data source "${key}" does not support SQL`);
    }

    return await cm.db.runSQL(sql, options);
  }

  async resolveFlowModelVariablesTemplate(
    ctx: ResourcerContext,
    options: {
      contractRd?: string | number;
      contextParams?: Record<string, unknown>;
      rd?: string | number;
      template: JSONValue;
    },
  ) {
    this.ensureRecordSlotResolvers(ctx.app);
    return await resolveFlowModelVariablesTemplate(ctx, options);
  }

  isLegacyVariableTemplateSafe(template: JSONValue) {
    return isLegacyVariableTemplateSafe(template);
  }

  async load() {
    await super.load();
    this.registerRecordSlotResolvers();
    registerFlowSurfacesResource(this);
    this.app.auditManager.registerAction('flowSql:save');
    this.app.auditManager.registerAction('flowModels:save');
    this.app.auditManager.registerAction('flowModels:duplicate');
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
          this.ensureRecordSlotResolvers(ctx.app);
          // 仅保留两种提交方式：
          // 1) values.batch: [{ id?, rd?, contractRd?, template, contextParams }]
          // 2) values.template + values.contextParams
          const raw = ctx.action?.params?.values ?? {};
          const values = typeof raw?.values !== 'undefined' ? raw.values : raw;

          // 批量解析分支
          if (Array.isArray(values?.batch)) {
            const batchItems = values.batch as Array<{
              contractRd?: string;
              rd?: string;
              id?: string | number;
              template: JSONValue;
              contextParams?: Record<string, unknown>;
            }>;
            type AuthorizedBatchItem = {
              analysis: AnalyzedTemplate;
              bindingPlan: RecordBindingPlan;
              id?: string | number;
              index: number;
              policy: ResolvePathPolicy;
              template: JSONValue;
            };
            const authorizedItems: AuthorizedBatchItem[] = [];
            const passthroughResults: Array<{ id?: string | number; data: unknown } | undefined> = [];

            for (const [index, item] of batchItems.entries()) {
              const template = item?.template ?? {};
              const authorization = await authorizeVariablesResolve(ctx as ResourcerContext, {
                contractRd: item?.contractRd,
                contextParams: item?.contextParams || {},
                rd: item?.rd,
                template,
              });

              if (authorization.allowed) {
                const authorizedItem = {
                  analysis: authorization.analysis,
                  bindingPlan: authorization.bindingPlan,
                  id: item?.id,
                  index,
                  policy: authorization.policy,
                  template,
                };
                authorizedItems.push(authorizedItem);
              } else {
                passthroughResults[index] = { id: item?.id, data: template };
              }
            }

            const resolvedItems = await resolveAnalyzedVariablesBatch(
              ctx as ResourcerContext,
              authorizedItems.map((item) => ({
                analysis: item.analysis,
                bindingPlan: item.bindingPlan,
                id: item.index,
                template: item.template,
                policy: item.policy,
              })),
            );
            for (const item of resolvedItems) {
              const index = Number(item.id);
              passthroughResults[index] = {
                id: batchItems[index]?.id,
                data: item.data,
              };
            }

            const results = passthroughResults.filter(
              (item): item is { id?: string | number; data: unknown } => !!item,
            );
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
          const authorization = await authorizeVariablesResolve(ctx as ResourcerContext, {
            contractRd: values?.contractRd,
            contextParams,
            rd: values?.rd,
            template,
          });
          ctx.body = authorization.allowed
            ? await resolveAnalyzedVariablesTemplate(
                ctx as ResourcerContext,
                authorization.analysis,
                authorization.policy,
                authorization.bindingPlan,
              )
            : template;
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
        const result = await transformSQL(record.sql);
        const sql = await parseLiquidContext(result.sql, liquidContext);
        ctx.body = await this.runSQLByDataSourceKey(record.dataSourceKey || dataSourceKey, sql, {
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
        ctx.body = await this.runSQLByDataSourceKey(dataSourceKey, sql, { type, filter, bind });
        await next();
      },
    });
  }

  async install() {}

  async afterEnable() {
    this.registerRecordSlotResolvers();
  }

  async afterDisable() {
    this.disposeRecordSlotResolvers();
  }

  async remove() {
    this.disposeRecordSlotResolvers();
  }

  private disposeRecordSlotResolvers() {
    this.recordSlotResolverDisposers.forEach((dispose) => dispose());
    this.recordSlotResolverDisposers = [];
  }

  private registerRecordSlotResolvers() {
    this.disposeRecordSlotResolvers();
    this.ensureRecordSlotResolvers(this.app);
  }

  private ensureRecordSlotResolvers(app: Application) {
    const registry = getRecordSlotResolverRegistry(app);
    for (const resolver of [...createBuiltInRecordSlotResolvers(), ...createFormItemRecordSlotResolvers()]) {
      if (!registry.has(resolver.owner, resolver.id)) {
        this.recordSlotResolverDisposers.push(registry.register(resolver));
      }
    }
  }
}

export default PluginFlowEngineServer;
