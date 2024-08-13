/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { UserDataResourceManager } from './user-data-resource-manager';
import { UserDataSyncService } from './user-data-sync-service';
import userDataActions from './actions/user-data';
import { SyncSourceManager } from './sync-source-manager';
import { SyncSourceModel } from './models/sync-source';
import { Logger, LoggerOptions } from '@nocobase/logger';
import { DepartmentDataSyncResource } from './department-data-sync-resource';

export class PluginUserDataSyncServer extends Plugin {
  sourceManager: SyncSourceManager;
  resourceManager: UserDataResourceManager;
  syncService: UserDataSyncService;

  async afterAdd() {}

  async beforeLoad() {
    this.app.db.registerModels({ SyncSourceModel });
    this.sourceManager = new SyncSourceManager();
    this.resourceManager = new UserDataResourceManager();
  }

  getLogger(): Logger {
    const logger = this.createLogger({
      dirname: 'user-data-sync',
      filename: '%DATE%.log',
    } as LoggerOptions);

    return logger;
  }

  async load() {
    const logger = this.getLogger();
    this.resourceManager.db = this.app.db;
    // TODO(yangqia): 在部门插件注册
    this.resourceManager.registerResource(new DepartmentDataSyncResource(this.db, this.app.logger), {
      // write department records after writing user records
      after: 'users',
    });
    this.syncService = new UserDataSyncService(this.resourceManager, this.sourceManager, logger);
    this.app.resourceManager.define({
      name: 'userData',
      actions: {
        listSyncTypes: userDataActions.listSyncTypes,
        pull: userDataActions.pull,
        push: userDataActions.push,
        retry: userDataActions.retry,
      },
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['userData:*', 'userDataSyncSources:*'],
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginUserDataSyncServer;
