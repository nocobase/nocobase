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
import { Application } from '@nocobase/server';
import { parseLiquidContext, transformSQL } from '@nocobase/utils';
import { lstat, readdir } from 'fs/promises';
import { basename, resolve } from 'path';
import { FlowSurfaceCapabilityProviderRegistry } from './flow-surfaces/capability-provider';
import { readFlowSurfaceCapabilityPolicyConfigFromPluginOptions } from './flow-surfaces/capability-policy';
import { registerFlowSurfacesResource } from './flow-surfaces';
import { loadFlowSurfaceAutoSnapshotsFromDirectory, type FlowSurfaceAutoSnapshot } from './flow-surfaces/extractor';
import { registerFlowSurfaceCapabilityAdmissionCommand } from './flow-surfaces/admission-report-cli';
import { registerFlowSurfaceExtractorCommand } from './flow-surfaces/extractor/cli';
import PluginUISchemaStorageServer from './server';
import { JSONValue } from './template/resolver';
import { resolveVariablesBatch, resolveVariablesTemplate } from './variables/resolve';

function isNodeErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error) && typeof error === 'object' && 'code' in error;
}

function isFlowSurfaceAutoSnapshotJsonFileName(fileName: string) {
  return fileName === basename(fileName) && fileName.toLowerCase().endsWith('.json');
}

export class PluginFlowEngineServer extends PluginUISchemaStorageServer {
  readonly flowSurfaceCapabilityProviders = new FlowSurfaceCapabilityProviderRegistry();
  flowSurfaceAutoSnapshots: readonly FlowSurfaceAutoSnapshot[] = [];
  private flowSurfaceAutoSnapshotRefreshPromise?: Promise<readonly FlowSurfaceAutoSnapshot[]>;
  private flowSurfaceAutoSnapshotRefreshCacheKey?: string;
  private flowSurfaceAutoSnapshotCacheKey?: string;

  static async staticImport() {
    Application.addCommand(registerFlowSurfaceExtractorCommand);
    Application.addCommand(registerFlowSurfaceCapabilityAdmissionCommand);
  }

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
    const capabilityPolicyConfig = readFlowSurfaceCapabilityPolicyConfigFromPluginOptions(this.options);
    await this.refreshFlowSurfaceAutoSnapshots(capabilityPolicyConfig.extractorSnapshotDir, { force: true });
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
            const results = await resolveVariablesBatch(ctx as ResourcerContext, batchItems);
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
          ctx.body = await resolveVariablesTemplate(ctx as ResourcerContext, template, contextParams);
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

  async refreshFlowSurfaceAutoSnapshots(
    snapshotDir?: string,
    options: {
      force?: boolean;
    } = {},
  ): Promise<readonly FlowSurfaceAutoSnapshot[]> {
    const capabilityPolicyConfig = readFlowSurfaceCapabilityPolicyConfigFromPluginOptions(this.options);
    const dir = snapshotDir || capabilityPolicyConfig.extractorSnapshotDir;
    const cacheKey = await this.getFlowSurfaceAutoSnapshotCacheKey(dir);
    if (!options.force && this.flowSurfaceAutoSnapshotCacheKey === cacheKey) {
      return this.flowSurfaceAutoSnapshots;
    }
    if (this.flowSurfaceAutoSnapshotRefreshPromise) {
      if (this.flowSurfaceAutoSnapshotRefreshCacheKey === cacheKey) {
        return this.flowSurfaceAutoSnapshotRefreshPromise;
      }
      await this.flowSurfaceAutoSnapshotRefreshPromise;
      return this.refreshFlowSurfaceAutoSnapshots(snapshotDir, options);
    }
    const refreshPromise = this.loadFlowSurfaceAutoSnapshotsFromStorage(dir)
      .then((snapshots) => {
        this.flowSurfaceAutoSnapshots = snapshots;
        this.flowSurfaceAutoSnapshotCacheKey = cacheKey;
        return snapshots;
      })
      .finally(() => {
        if (this.flowSurfaceAutoSnapshotRefreshPromise === refreshPromise) {
          this.flowSurfaceAutoSnapshotRefreshPromise = undefined;
          this.flowSurfaceAutoSnapshotRefreshCacheKey = undefined;
        }
      });
    this.flowSurfaceAutoSnapshotRefreshPromise = refreshPromise;
    this.flowSurfaceAutoSnapshotRefreshCacheKey = cacheKey;
    return refreshPromise;
  }

  protected loadFlowSurfaceAutoSnapshotsFromStorage(dir: string) {
    return loadFlowSurfaceAutoSnapshotsFromDirectory({ dir });
  }

  protected async getFlowSurfaceAutoSnapshotCacheKey(snapshotDir: string) {
    const dir = resolve(snapshotDir);
    try {
      const stats = await lstat(dir);
      if (!stats.isDirectory() || stats.isSymbolicLink()) {
        return `${dir}:invalid:${stats.mtimeMs}`;
      }
      const fileNames = await readdir(dir);
      const files: string[] = [];
      for (const fileName of fileNames.sort((left, right) => left.localeCompare(right))) {
        if (!isFlowSurfaceAutoSnapshotJsonFileName(fileName)) {
          continue;
        }
        try {
          const fileStats = await lstat(resolve(dir, fileName));
          files.push(
            [
              fileName,
              fileStats.isFile() && !fileStats.isSymbolicLink() ? 'file' : 'ignored',
              fileStats.dev,
              fileStats.ino,
              fileStats.size,
              fileStats.mtimeMs,
              fileStats.ctimeMs,
            ].join(':'),
          );
        } catch (error) {
          files.push(`${fileName}:missing:${error instanceof Error ? error.message : String(error)}`);
        }
      }
      return `${dir}:${stats.dev}:${stats.ino}:${stats.mtimeMs}:${files.join('|')}`;
    } catch (error) {
      if (isNodeErrnoException(error) && error.code === 'ENOENT') {
        return `${dir}:missing`;
      }
      return `${dir}:unknown`;
    }
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFlowEngineServer;
