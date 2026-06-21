/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Collection, CollectionContext, CollectionOptions, Field, Model } from '@nocobase/database';
import { QueryInterfaceDropTableOptions, QueryInterfaceOptions } from 'sequelize';
import { RemoteLocalBridgeFactory } from './bridges/remote-local-bridge';
import { DatabaseServerModel } from './models/database-server';
import PluginCollectionFDWServer from './plugin';

export class ForeignDataCollection extends Collection {
  constructor(options: CollectionOptions, context: CollectionContext) {
    if (!options.autoGenId) {
      options.autoGenId = false;
    }

    if (!options.timestamps) {
      options.timestamps = false;
    }
    options.underscored = false;
    super(options, context);
  }

  static registerOptions(plugin: PluginCollectionFDWServer) {
    return {
      condition(options) {
        return options.remoteServerName && options.remoteTableInfo;
      },

      async onDump() {
        return;
      },

      async onSync(model: typeof Model, options) {
        const transaction = options?.transaction;
        const { remoteServerName, remoteTableInfo } = model.collection.options;

        const remoteServerInstance: DatabaseServerModel = await model.database
          .getRepository('databaseServers')
          .findOne({
            filterByTk: remoteServerName,
            transaction,
          });

        if (!remoteServerInstance) {
          throw new Error(`remoteServer ${remoteServerName} not found`);
        }

        remoteServerInstance.setApp(plugin.app);

        await remoteServerInstance.createServer({
          transaction,
        });

        const remoteLocalBridge = RemoteLocalBridgeFactory.createBridge({
          remoteDatabase: remoteServerInstance.getRemoteDatabaseInstance(),
          localDatabase: model.database,
        });

        await remoteLocalBridge.createTable({
          remoteServerName,
          remoteTableDefinition: await remoteServerInstance.showTableDefinition(remoteTableInfo),
          remoteTableInfo,
          localModel: model,
          transaction,
        });
      },
    };
  }

  async removeFieldFromDb(name: string, options?: QueryInterfaceOptions): Promise<void> {
    const field = this.getField(name);
    if (field) {
      field.remove();
    }
  }

  async removeFromDb(options?: QueryInterfaceDropTableOptions) {
    const transaction = options?.transaction;

    if (this.db.inDialect('postgres')) {
      let sql = `DROP FOREIGN TABLE IF EXISTS ${this.getTableNameWithSchemaAsString()}`;

      if (options?.cascade) {
        sql += ' CASCADE';
      }

      await this.db.sequelize.query(sql, {
        transaction,
      });

      return this.remove();
    } else {
      await super.removeFromDb(options);
    }
  }

  protected bindFieldEventListener() {
    super.bindFieldEventListener();

    this.on('field.afterAdd', (field: Field) => {
      const interfaceOption = field.options.interface;

      if (interfaceOption === 'updatedAt') {
        // @ts-ignore
        this.model._timestampAttributes.createdAt = field.name;
      }

      if (interfaceOption === 'createdAt') {
        // @ts-ignore
        this.model._timestampAttributes.updatedAt = field.name;
      }
    });
  }
}
