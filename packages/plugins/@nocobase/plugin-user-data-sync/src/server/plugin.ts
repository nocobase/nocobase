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
import userDataSyncSourcesActions from './actions/user-data-sync-sources';
import userDataSyncTasksActions from './actions/user-data-sync-tasks';
import { SyncSourceManager } from './sync-source-manager';
import { DefaultSyncSource } from './default-sync-source';
import { DefaultUserDataResource } from './default-user-data-resource';
import { SyncSourceModel } from './models/sync-source';
import { SyncTaskModel } from './models/sync-task';
import { createSystemLogger, Logger, LoggerOptions } from '@nocobase/logger';
import { AuthModel } from '@nocobase/plugin-auth';

export class PluginUserDataSyncServer extends Plugin {
  sourceManager: SyncSourceManager;
  resourceManager: UserDataResourceManager;
  syncService: UserDataSyncService;

  async afterAdd() {}

  async beforeLoad() {
    this.app.db.registerModels({ SyncSourceModel, SyncTaskModel, AuthModel });
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
    const defaultUserDataResource = new DefaultUserDataResource(this.app.db, logger);
    this.resourceManager.reigsterResource('default', defaultUserDataResource);
    this.syncService = new UserDataSyncService(this.resourceManager, this.sourceManager, logger);
    this.app.resourceManager.define({
      name: 'userDataSyncSources',
      actions: {
        sync: userDataSyncSourcesActions.sync,
        listTypes: userDataSyncSourcesActions.listTypes,
      },
    });
    this.app.resourceManager.define({
      name: 'userDataSyncTasks',
      actions: {
        retry: userDataSyncTasksActions.retry,
      },
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginUserDataSyncServer;
