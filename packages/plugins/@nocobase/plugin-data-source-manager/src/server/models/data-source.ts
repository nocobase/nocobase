/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, AvailableActionOptions } from '@nocobase/acl';
import { Model, Transaction } from '@nocobase/database';
import { setCurrentRole } from '@nocobase/plugin-acl';
import { Application } from '@nocobase/server';
import path from 'path';
import PluginDataSourceManagerServer from '../plugin';
import { DataSourcesRolesModel } from './data-sources-roles-model';

const availableActions: {
  [key: string]: AvailableActionOptions;
} = {
  create: {
    displayName: '{{t("Add new")}}',
    type: 'new-data',
    onNewRecord: true,
    allowConfigureFields: true,
  },
  // import: {
  //   displayName: '{{t("Import")}}',
  //   type: 'new-data',
  //   scope: false,
  // },
  // export: {
  //   displayName: '{{t("Export")}}',
  //   type: 'old-data',
  //   allowConfigureFields: true,
  // },
  view: {
    displayName: '{{t("View")}}',
    type: 'old-data',
    aliases: ['get', 'list'],
    allowConfigureFields: true,
  },
  update: {
    displayName: '{{t("Edit")}}',
    type: 'old-data',
    aliases: ['update', 'move'],
    allowConfigureFields: true,
  },
  destroy: {
    displayName: '{{t("Delete")}}',
    type: 'old-data',
  },
};

export class DataSourceModel extends Model {
  isMainRecord() {
    return this.get('type') === 'main';
  }

  async loadIntoACL(options: { app: Application; acl: ACL; transaction?: Transaction }) {
    const { app, acl } = options;
    const loadRoleIntoACL = async (model: DataSourcesRolesModel) => {
      await model.writeToAcl({
        acl,
      });
    };

    const rolesModel: DataSourcesRolesModel[] = await app.db.getRepository('dataSourcesRoles').find({
      transaction: options.transaction,
      filter: {
        dataSourceKey: this.get('key'),
      },
    });

    for (const roleModel of rolesModel) {
      await loadRoleIntoACL(roleModel);
    }
  }

  async loadIntoApplication(options: {
    app: Application;
    transaction?: Transaction;
    loadAtAfterStart?: boolean;
    refresh?: boolean;
  }) {
    const { app, loadAtAfterStart, refresh } = options;

    const dataSourceKey = this.get('key');

    const pluginDataSourceManagerServer = app.pm.get('data-source-manager') as PluginDataSourceManagerServer;

    if (pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] === 'loaded') {
      pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'reloading';
    } else {
      pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'loading';
    }

    const type = this.get('type');
    const createOptions = this.get('options');

    try {
      const dataSource = app.dataSourceManager.factory.create(type, {
        ...createOptions,
        name: dataSourceKey,
        logger: app.logger.child({ dataSourceKey }),
        sqlLogger: app.sqlLogger.child({ dataSourceKey }),
        cache: app.cache,
        storagePath: path.join(process.cwd(), 'storage', 'cache', 'apps', app.name),
      });

      dataSource.on('loadingProgress', (progress) => {
        pluginDataSourceManagerServer.dataSourceLoadingProgress[dataSourceKey] = progress;
      });

      if (loadAtAfterStart) {
        dataSource.on('loadMessage', ({ message }) => {
          app.setMaintainingMessage(`${message} in data source ${this.get('displayName')}`);
        });
      }

      const acl = dataSource.acl;

      for (const [actionName, actionParams] of Object.entries(availableActions)) {
        acl.setAvailableAction(actionName, actionParams);
      }

      acl.allow('*', '*', (ctx) => {
        return ctx.state.currentRoles?.includes('root');
      });

      dataSource.resourceManager.use(setCurrentRole, { tag: 'setCurrentRole', before: 'acl', after: 'auth' });

      await this.loadIntoACL({ app, acl, transaction: options.transaction });

      await app.dataSourceManager.add(dataSource, {
        localData: await this.loadLocalData(),
        refresh,
      });
    } catch (e) {
      app.logger.error(`load data source failed`, { cause: e });

      if (pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] === 'loading') {
        pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'loading-failed';
      }

      if (pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] === 'reloading') {
        pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'reloading-failed';
      }

      pluginDataSourceManagerServer.dataSourceErrors[dataSourceKey] = e;
      return;
    }

    pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'loaded';
  }

  private async loadLocalData() {
    const dataSourceKey = this.get('key');

    const remoteCollections = await this.db.getRepository('dataSourcesCollections').find({
      filter: {
        dataSourceKey,
      },
    });

    const remoteFields = await this.db.getRepository('dataSourcesFields').find({
      filter: {
        dataSourceKey,
      },
    });

    const localData = {};

    for (const remoteCollection of remoteCollections) {
      const remoteCollectionOptions = remoteCollection.toJSON();
      localData[remoteCollectionOptions.name] = remoteCollectionOptions;
    }

    for (const remoteField of remoteFields) {
      const remoteFieldOptions = remoteField.toJSON();
      const collectionName = remoteFieldOptions.collectionName;

      if (!localData[collectionName]) {
        localData[collectionName] = {
          name: collectionName,
          fields: [],
        };
      }

      if (!localData[collectionName].fields) {
        localData[collectionName].fields = [];
      }

      localData[collectionName].fields.push(remoteFieldOptions);
    }

    return localData;
  }
}
