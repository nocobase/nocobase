/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import Database, { MagicAttributeModel, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { RemoteLocalBridgeFactory } from '../bridges/remote-local-bridge';

type TableInfo = {
  tableName: string;
  schema?: string;
};

export class DatabaseServerModel extends MagicAttributeModel {
  protected app: Application;

  setApp(app: Application) {
    this.app = app;
  }

  renderJsonTemplate(options) {
    if (!this.app?.environment) {
      return options;
    }
    return this.app.environment.renderJsonTemplate(options);
  }

  getRemoteDatabaseInstance(): Database {
    return new Database(
      this.renderJsonTemplate({
        ...this.toJSON(),
      }),
    );
  }

  getOptions() {
    return this.renderJsonTemplate({
      ...this.toJSON(),
    });
  }

  async listRemoteTables() {
    const remoteDB = this.getRemoteDatabaseInstance();
    if (remoteDB.inDialect('postgres')) {
      const results = await remoteDB.sequelize.query(
        `
          SELECT table_name as name, table_schema as schema
          FROM information_schema.tables
          WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        `,
        {
          type: 'SELECT',
        },
      );

      await remoteDB.close();

      return results;
    } else {
      const options = this.getOptions();
      const results = await remoteDB.sequelize.query(
        `
          SELECT table_name as name
          FROM information_schema.tables
          WHERE table_schema = '${options.database}'
        `,
        {
          type: 'SELECT',
        },
      );

      await remoteDB.close();

      return results;
    }
  }

  async describeTable(table: TableInfo) {
    const remoteDB = this.getRemoteDatabaseInstance();

    const columns = await remoteDB.sequelize.getQueryInterface().describeTable(table);

    await remoteDB.close();
    return columns;
  }

  async showIndexes(table: TableInfo) {
    const remoteDB = this.getRemoteDatabaseInstance();

    const queryOptions = (() => {
      if (remoteDB.inDialect('postgres')) {
        return table;
      }
      return table.tableName;
    })();

    //@ts-ignore
    const constraints = await remoteDB.sequelize.getQueryInterface().showIndex(queryOptions);

    await remoteDB.close();
    return constraints;
  }

  async showTableDefinition(tableInfo: TableInfo) {
    const remoteDB = this.getRemoteDatabaseInstance();
    const def = await remoteDB.queryInterface.showTableDefinition(tableInfo);
    await remoteDB.close();
    return def;
  }

  async updateServer(options?: Transactionable) {
    const { transaction } = options;
    const db = this.app.db;
    const remoteInstance = this.getRemoteDatabaseInstance();

    try {
      await remoteInstance.sequelize.authenticate();
    } catch (error) {
      throw new Error(`Unable to connect to the remote database: ${error.message}`);
    }

    const replacements = this.renderJsonTemplate({
      serverName: this.get('name'),
      host: this.get('host'),
      port: this.get('port'),
      database: this.get('database'),
      user: this.get('username'),
      password: this.get('password'),
    });

    if (db.inDialect('postgres')) {
      await db.sequelize.query(
        `
        ALTER SERVER ${this.get('name')}
        OPTIONS (SET host :host, SET port :port, SET dbname :database);

        ALTER USER MAPPING FOR ${db.options.username}
        SERVER ${this.get('name')}
        OPTIONS (SET user :user, SET password :password);
        `,
        {
          replacements,
          type: 'RAW',
          transaction,
        },
      );
    }

    if (db.inDialect('mysql', 'mariadb')) {
      await db.sequelize.query(
        `
        ALTER SERVER ${this.get('name')}
        OPTIONS (USER :user, HOST :host, PORT ${replacements.port}, DATABASE :database, PASSWORD :password);
        `,
        {
          replacements,
          transaction,
        },
      );
    }
  }

  async destroyServer(options?: Transactionable) {
    const { transaction } = options;
    const db = this.app.db;

    if (db.inDialect('postgres')) {
      await db.sequelize.query(
        `
        DROP SERVER IF EXISTS ${this.get('name')} CASCADE;
        `,
        {
          transaction,
          type: 'RAW',
        },
      );
    }

    if (db.inDialect('mysql', 'mariadb')) {
      await db.sequelize.query(
        `
        DROP SERVER IF EXISTS ${this.get('name')};
        `,
        {
          transaction,
          type: 'RAW',
        },
      );
    }
  }

  async createServer(options?: Transactionable) {
    const { transaction } = options;
    const db = this.app.db;

    const remoteInstance = this.getRemoteDatabaseInstance();

    try {
      await remoteInstance.sequelize.authenticate();
    } catch (error) {
      throw new Error(`Unable to connect to the remote database: ${error.message}`);
    }

    const remoteLocalBridge = RemoteLocalBridgeFactory.createBridge({
      remoteDatabase: remoteInstance,
      localDatabase: db,
    });

    const opts = this.renderJsonTemplate({
      serverName: this.get('name'),
      host: this.get('host'),
      port: this.get('port'),
      database: this.get('database'),
      user: this.get('username'),
      password: this.get('password'),
    });

    await remoteLocalBridge.createServer({
      ...opts,
      transaction,
    });
  }
}
