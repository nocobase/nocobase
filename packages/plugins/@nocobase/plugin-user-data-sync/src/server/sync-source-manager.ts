/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { SyncSource, SyncSourceExtend } from './sync-source';
import { Context } from '@nocobase/actions';
import { SyncSourceModel } from './models/sync-source';

type SyncSourceConfig = {
  syncSource: SyncSourceExtend<SyncSource>;
  title?: string;
};

export class SyncSourceManager {
  protected syncSourceTypes: Registry<SyncSourceConfig> = new Registry();
  registerType(syncSourceType: string, syncSourceConfig: SyncSourceConfig) {
    this.syncSourceTypes.register(syncSourceType, syncSourceConfig);
  }

  listTypes() {
    return Array.from(this.syncSourceTypes.getEntities()).map(([syncSourceType, source]) => ({
      name: syncSourceType,
      title: source.title,
    }));
  }

  async getByName(name: string, ctx: Context) {
    const repo = ctx.db.getRepository('userDataSyncSources');
    const sourceInstance: SyncSourceModel = await repo.findOne({ filter: { enabled: true, name: name } });
    if (!sourceInstance) {
      throw new Error(`SyncSource [${name}] is not found.`);
    }
    return this.create(sourceInstance, ctx);
  }

  async getById(id: number, ctx: Context) {
    const repo = ctx.db.getRepository('userDataSyncSources');
    const sourceInstance: SyncSourceModel = await repo.findOne({ filter: { enabled: true }, filterByTk: id });
    if (!sourceInstance) {
      throw new Error(`SyncSource [${id}] is not found.`);
    }
    return this.create(sourceInstance, ctx);
  }

  create(sourceInstance: SyncSourceModel, ctx: Context) {
    const { syncSource } = this.syncSourceTypes.get(sourceInstance.sourceType) || {};
    if (!syncSource) {
      throw new Error(`SyncSourceType [${sourceInstance.sourceType}] is not found.`);
    }
    return new syncSource({ sourceInstance: sourceInstance, options: sourceInstance.options, ctx });
  }
}
