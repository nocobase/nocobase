import Database, { IDatabaseOptions, Model, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import lodash from 'lodash';
import * as path from 'path';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
}

export class ApplicationModel extends Model {
  static getDatabaseConfig(app: Application): IDatabaseOptions {
    const oldConfig =
      app.options.database instanceof Database
        ? (app.options.database as Database).options
        : (app.options.database as IDatabaseOptions);

    return lodash.cloneDeep(lodash.omit(oldConfig, ['migrator']));
  }

  static async handleAppStart(app: Application, options: registerAppOptions) {
    await app.load();

    if (!options?.skipInstall) {
      await app.db.sync();
      await app.install();
    }

    await app.start();
  }

  async registerToMainApp(mainApp: Application, options: registerAppOptions) {
    const appName = this.get('name') as string;
    const appOptions = (this.get('options') as any) || {};

    const AppModel = this.constructor as typeof ApplicationModel;

    const createDatabase = async () => {
      const database = appName;
      const { host, port, username, password, dialect } = mainApp.db.options;

      if (dialect === 'mysql') {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({ host, port, user: username, password });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        await connection.close();
      }

      if (dialect === 'postgres') {
        const { Client } = require('pg');

        const client = new Client({
          host,
          port,
          user: username,
          password,
          database: 'postgres',
        });

        await client.connect();

        try {
          await client.query(`CREATE DATABASE "${database}"`);
        } catch (e) {}

        await client.end();
      }
    };

    if (!options?.skipInstall) {
      await createDatabase();
    }

    const app = mainApp.appManager.createApplication(appName, {
      ...AppModel.initOptions(appName, mainApp),
      ...appOptions,
    });

    await AppModel.handleAppStart(app, options);

    await AppModel.update(
      {
        status: 'running',
      },
      {
        transaction: options.transaction,
        where: {
          [AppModel.primaryKeyAttribute]: this.get(AppModel.primaryKeyAttribute),
        },
        hooks: false,
      },
    );
  }

  static initOptions(appName: string, mainApp: Application) {
    const rawDatabaseOptions = this.getDatabaseConfig(mainApp);

    if (rawDatabaseOptions.dialect === 'sqlite') {
      const mainAppStorage = rawDatabaseOptions.storage;
      if (mainAppStorage !== ':memory:') {
        const mainStorageDir = path.dirname(mainAppStorage);
        rawDatabaseOptions.storage = path.join(mainStorageDir, `${appName}.sqlite`);
      }
    } else {
      rawDatabaseOptions.database = appName;
    }

    return {
      database: {
        ...rawDatabaseOptions,
        tablePrefix: '',
      },
      plugins: ['nocobase'],
      resourcer: {
        prefix: '/api',
      },
    };
  }
}
