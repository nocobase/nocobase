import { AppMigrator } from './app-migrator';
import path from 'path';
import fsPromises from 'fs/promises';
import { readLines, sqlAdapter } from './utils';
import { DataTypes } from '@nocobase/database';
import lodash from 'lodash';
import decompress from 'decompress';

export class Restorer extends AppMigrator {
  async restore(backupFilePath: string) {
    await this.decompressBackup(backupFilePath);
    await this.importCollections();
    await this.clearWorkDir();
  }

  async importCollections(options?: { ignore?: string | string[] }) {
    const collectionsDir = path.resolve(this.workDir, 'collections');

    const collections = await fsPromises.readdir(collectionsDir);

    const ignore = lodash.castArray(options?.ignore);

    if (ignore.includes('users')) {
      ignore.push('rolesUsers');
    }

    // import plugins
    await this.importCollection({
      name: 'applicationPlugins',
    });

    await this.app.reload();

    const metaCollections = [
      'uiSchemas',
      'uiRoutes',
      'uiSchemaServerHooks',
      'uiSchemaTemplates',
      'uiSchemaTreePath',
      'collections',
      'fields',
    ];

    // import collections and uiSchemas
    for (const collectionName of metaCollections) {
      await this.importCollection({
        name: collectionName,
      });
    }

    //@ts-ignore
    await this.app.db.getRepository('collections').load();

    await this.app.db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    const expectedCollections = [...metaCollections, 'applicationPlugins'];

    // import custom collections
    for (const collectionName of collections.filter(
      (collectionName) => !expectedCollections.includes(collectionName),
    )) {
      if (ignore.includes(collectionName)) {
        continue;
      }

      await this.importCollection({
        name: collectionName,
      });
    }
  }

  async decompressBackup(backupFilePath: string) {
    await decompress(backupFilePath, this.workDir);
  }

  async importCollection(options: { name: string; insert?: boolean; clear?: boolean }) {
    const app = this.app;
    const collectionName = options.name;
    const dir = this.workDir;
    const collection = app.db.getCollection(collectionName);
    const collectionDataPath = path.resolve(dir, 'collections', collectionName, 'data');
    const collectionMetaPath = path.resolve(dir, 'collections', collectionName, 'meta');

    const metaContent = await fsPromises.readFile(collectionMetaPath, 'utf8');
    const meta = JSON.parse(metaContent);
    app.log.info(`collection meta ${metaContent}`);
    const tableName = meta.tableName;

    if (options.clear !== false) {
      // truncate old data
      let sql = `TRUNCATE TABLE "${tableName}"`;

      if (app.db.inDialect('sqlite')) {
        sql = `DELETE
               FROM "${tableName}"`;
      }

      await app.db.sequelize.query(sqlAdapter(app.db, sql));
    }

    // read file content from collection data
    const rows = await readLines(collectionDataPath);

    if (rows.length == 0) {
      app.logger.info(`${collectionName} has no data to import`);
      return;
    }

    const columns = meta['columns'];

    const fields = columns
      .map((column) => [column, collection.getField(column)])
      .reduce((carry, [column, type]) => {
        carry[column] = type;
        return carry;
      }, {});

    const rowsWithMeta = rows.map((row) =>
      JSON.parse(row)
        .map((val, index) => [columns[index], val])
        .reduce((carry, [column, val]) => {
          if (val === null) {
            carry[column] = null;
            return carry;
          }

          const field = fields[column];

          if (!field) {
            carry[column] = val;
            return carry;
          }

          if (field.type === 'point') {
            val = `(${val.x}, ${val.y})`;
          }

          if (field.dataType === DataTypes.BOOLEAN) {
            val = Boolean(val);
          }

          if (field.dataType === DataTypes.JSON) {
            val = lodash.isString(val) ? JSON.parse(val) : val;
          }

          carry[column] = val;

          return carry;
        }, {}),
    );

    const model = collection.model;

    const fieldMappedAttributes = {};
    // @ts-ignore
    for (const attr in model.tableAttributes) {
      fieldMappedAttributes[model.rawAttributes[attr].field || attr] = model.rawAttributes[attr];
    }

    //@ts-ignore
    const sql = collection.model.queryInterface.queryGenerator.bulkInsertQuery(
      tableName,
      rowsWithMeta,
      {},
      fieldMappedAttributes,
    );

    if (options.insert === false) {
      return sql;
    }

    await app.db.sequelize.query(sql, {
      type: 'INSERT',
    });

    app.logger.info(`${collectionName} imported with ${rows.length} rows`);
  }
}
