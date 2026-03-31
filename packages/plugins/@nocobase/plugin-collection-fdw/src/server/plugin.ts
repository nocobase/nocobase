/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Database } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { MariadbToMariadbBridge } from './bridges/mariadb-to-mariadb';
import { MySQLToMySQLBridge } from './bridges/mysql-to-mysql';
import { PgToPgBridge } from './bridges/pg-to-pg';
import { RemoteLocalBridgeFactory } from './bridges/remote-local-bridge';
import { ForeignDataCollection } from './foreign-data-collection';
import { DatabaseServerModel } from './models/database-server';
import tablesResourcer from './resourcers/tables';

export default class PluginCollectionFDWServer extends Plugin {
  async beforeLoad() {
    RemoteLocalBridgeFactory.registerBridge('postgres', 'postgres', PgToPgBridge);
    RemoteLocalBridgeFactory.registerBridge('mariadb', 'mariadb', MariadbToMariadbBridge);
    RemoteLocalBridgeFactory.registerBridge('mysql', 'mysql', MySQLToMySQLBridge);

    const app = this.app;

    this.app.db.registerModels({
      DatabaseServerModel,
    });

    this.app.db.on('databaseServers.beforeCreate', async (model: DatabaseServerModel, options) => {
      if (!model.get('dialect')) {
        const dialect = this.db.options.dialect;
        model.set('dialect', dialect);
      }
      model.setApp(this.app);
      await model.createServer(options);
    });

    this.app.db.on('databaseServers.afterUpdate', async (model: DatabaseServerModel, options) => {
      model.setApp(this.app);
      await model.updateServer(options);
    });

    this.app.db.on('databaseServers.afterDestroy', async (model: DatabaseServerModel, options) => {
      model.setApp(this.app);
      await model.destroyServer(options);
    });

    this.app.resourceManager.define(tablesResourcer);

    this.app.db.collectionFactory.registerCollectionType(
      ForeignDataCollection,
      ForeignDataCollection.registerOptions(this),
    );

    this.app.resourceManager.registerActionHandlers({
      async ['databaseServers:testConnection'](ctx, next) {
        const values = ctx.app.environment.renderJsonTemplate(ctx.action.params.values || {});

        const db = new Database({
          dialect: app.db.options.dialect,
          ...values,
        });

        try {
          await db.sequelize.authenticate();
        } catch (error) {
          throw new Error(`Unable to connect to the remote database: ${error.message}`);
        }

        ctx.body = {
          success: true,
        };
        await next();
      },
    });
  }

  async load() {
    this.app.acl.registerSnippet({
      name: 'pm.data-source-manager.collection-fdw',
      actions: ['databaseServers:*', 'databaseServers.tables:*'],
    });
  }

  async beforeEnable() {
    if (this.db.inDialect('sqlite')) {
      throw new Error('sqlite does not support foreign data wrapper');
    }
  }
}
