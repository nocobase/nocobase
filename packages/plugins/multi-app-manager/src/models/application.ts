import Database, { IDatabaseOptions, Model, TransactionAble } from '@nocobase/database';
import { Application } from '@nocobase/server';
import lodash from 'lodash';
import * as path from 'path';

interface registerAppOptions extends TransactionAble {
  skipInstall?: boolean;
}

export class ApplicationModel extends Model {
  static getDatabaseConfig(app: Application): IDatabaseOptions {
    return lodash.cloneDeep(
      lodash.isPlainObject(app.options.database)
        ? (app.options.database as IDatabaseOptions)
        : (app.options.database as Database).options,
    );
  }

  async registerToMainApp(mainApp: Application, options: registerAppOptions) {
    const { transaction } = options;
    const appName = this.get('name') as string;
    const appOptions = (this.get('options') as any) || {};

    const app = mainApp.appManager.createApplication(appName, {
      ...ApplicationModel.initOptions(appName, mainApp),
      ...appOptions,
    });

    app.on('beforeInstall', async function createDatabase() {
      const { host, port, username, password, database, dialect } = ApplicationModel.getDatabaseConfig(app);

      if (dialect === 'mysql') {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection({ host, port, user: username, password });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        await connection.close();
      }

      if (dialect === 'postgres') {
        const { Client } = require('pg');

        const client = new Client({
          user: username,
          host,
          password: password,
          port,
        });

        await client.connect();

        try {
          await client.query(`CREATE DATABASE "${database}"`);
        } catch (e) {}

        await client.end();
      }
    });

    await app.load();

    if (!lodash.get(options, 'skipInstall', false)) {
      await app.install();
    }

    await app.start();
  }

  static initOptions(appName: string, mainApp: Application) {
    const rawDatabaseOptions = ApplicationModel.getDatabaseConfig(mainApp);

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
      database: rawDatabaseOptions,
    };
  }
}
