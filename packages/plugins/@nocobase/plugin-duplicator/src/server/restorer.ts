import decompress from 'decompress';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { AppMigrator, AppMigratorOptions } from './app-migrator';
import { readLines } from './utils';
import { Application } from '@nocobase/server';
import { DataTypes, DumpDataType } from '@nocobase/database';
import lodash, { isPlainObject } from 'lodash';
import { FieldValueWriter } from './field-value-writer';
import * as Topo from '@hapi/topo';
import { RestoreCheckError } from './errors/restore-check-error';

type RestoreOptions = {
  dataTypes: Set<DumpDataType>;
};

export class Restorer extends AppMigrator {
  direction = 'restore' as const;
  backUpFilePath: string;
  decompressed = false;
  importedCollections: string[] = [];

  constructor(
    app: Application,
    options: AppMigratorOptions & {
      backUpFilePath?: string;
    },
  ) {
    super(app, options);
    const { backUpFilePath } = options;

    if (backUpFilePath) {
      this.setBackUpFilePath(backUpFilePath);
    }
  }

  static sortCollectionsByInherits(
    collections: Array<{
      name: string;
      inherits: string[];
    }>,
  ): any {
    const sorter = new Topo.Sorter();

    for (const collection of collections) {
      const options: any = {
        group: collection.name,
      };

      if (collection.inherits?.length) {
        options.after = collection.inherits;
      }
      sorter.add(collection, options);
    }

    return sorter.sort();
  }

  setBackUpFilePath(backUpFilePath: string) {
    if (path.isAbsolute(backUpFilePath)) {
      this.backUpFilePath = backUpFilePath;
    } else if (path.basename(backUpFilePath) === backUpFilePath) {
      const dirname = path.resolve(process.cwd(), 'storage', 'duplicator');
      this.backUpFilePath = path.resolve(dirname, backUpFilePath);
    } else {
      this.backUpFilePath = path.resolve(process.cwd(), backUpFilePath);
    }
  }

  async parseBackupFile() {
    await this.decompressBackup(this.backUpFilePath);
    return await this.getImportMeta();
  }

  async restore(options: RestoreOptions) {
    await this.decompressBackup(this.backUpFilePath);
    await this.checkMeta();
    await this.importCollections(options);
    await this.importDb();
    await this.upgradeApp();
    await this.clearWorkDir();
  }

  async getImportMeta() {
    const metaFile = path.resolve(this.workDir, 'meta');
    return JSON.parse(await fsPromises.readFile(metaFile, 'utf8')) as any;
  }

  async checkMeta() {
    const meta = await this.getImportMeta();

    if (meta['dialectOnly'] && !this.app.db.inDialect(meta['dialect'])) {
      throw new RestoreCheckError(`this backup file can only be imported in database ${meta['dialect']}`);
    }

    const checkEnv = (envName: string) => {
      const valueInPackage = meta[envName] || '';
      const valueInEnv = process.env[envName] || '';

      if (valueInPackage && valueInEnv !== valueInPackage) {
        throw new RestoreCheckError(`for use this backup file, please set ${envName}=${valueInPackage}`);
      }
    };

    for (const envName of ['DB_UNDERSCORED', 'DB_SCHEMA', 'COLLECTION_MANAGER_SCHEMA', 'DB_TABLE_PREFIX']) {
      checkEnv(envName);
    }
  }

  async importCollections(options: RestoreOptions) {
    const importCollection = async (collectionName: string) => {
      await this.importCollection({
        name: collectionName,
      });
    };

    const { dumpableCollectionsGroupByDataTypes, delayCollections } = await this.parseBackupFile();

    // import plugins
    await importCollection('applicationPlugins');
    await this.app.reload();

    // import meta collections
    const metaCollections = dumpableCollectionsGroupByDataTypes.meta;

    for (const collection of metaCollections) {
      if (collection.name === 'applicationPlugins') {
        continue;
      }

      if (delayCollections.includes(collection.name)) {
        continue;
      }

      await importCollection(collection.name);
    }

    if (options.dataTypes.has('config')) {
      const configCollections = dumpableCollectionsGroupByDataTypes.config;

      for (const collection of configCollections) {
        await importCollection(collection.name);
      }
    }

    if (options.dataTypes.has('business')) {
      const businessCollections = dumpableCollectionsGroupByDataTypes.business;

      for (const collection of Restorer.sortCollectionsByInherits(businessCollections)) {
        // skip import view collection in logic level
        if (collection.isView) {
          continue;
        }
        await importCollection(collection.name);
      }
    }

    await this.app.reload();

    await (this.app.db.getRepository('collections') as any).load();

    await this.app.db.sync();

    for (const collectionName of delayCollections) {
      const delayRestore = this.app.db.getCollection(collectionName).options.duplicator['delayRestore'];
      await delayRestore(this);
    }

    await this.emitAsync('restoreCollectionsFinished');
  }

  async decompressBackup(backupFilePath: string) {
    if (!this.decompressed) await decompress(backupFilePath, this.workDir);
  }

  async importCollection(options: {
    name: string;
    insert?: boolean;
    clear?: boolean;
    rowCondition?: (row: any) => boolean;
  }) {
    const app = this.app;
    const db = app.db;

    const collectionName = options.name;
    if (!collectionName) {
      throw new Error('collection name is required');
    }

    const dir = this.workDir;

    const collectionDataPath = path.resolve(dir, 'collections', collectionName, 'data');
    const collectionMetaPath = path.resolve(dir, 'collections', collectionName, 'meta');

    const metaContent = await fsPromises.readFile(collectionMetaPath, 'utf8');
    const meta = JSON.parse(metaContent);

    let addSchemaTableName: any = meta.tableName;

    if (!this.app.db.inDialect('postgres') && isPlainObject(addSchemaTableName)) {
      addSchemaTableName = addSchemaTableName.tableName;
    }

    const columns = meta['columns'];

    if (columns.length == 0) {
      app.logger.info(`${collectionName} has no columns`);
      return;
    }

    const fieldAttributes = lodash.mapValues(meta.attributes, (attr) => {
      if (attr.isCollectionField) {
        const fieldClass = db.fieldTypes.get(attr.type);
        if (!fieldClass) throw new Error(`field type ${attr.type} not found`);

        return new fieldClass(attr.typeOptions, {
          database: db,
        });
      }

      return undefined;
    });

    const rawAttributes = lodash.mapValues(meta.attributes, (attr, key) => {
      if (attr.isCollectionField) {
        const field = fieldAttributes[key];
        return {
          ...field.toSequelize(),
          field: attr.field,
        };
      }

      const obj = {
        ...attr,
        type: new DataTypes[attr.type](),
      };

      if (attr.defaultValue && ['JSON', 'JSONB', 'JSONTYPE'].includes(attr.type)) {
        obj.defaultValue = JSON.stringify(attr.defaultValue);
      }

      return obj;
    });

    if (options.clear !== false) {
      // drop table
      await db.sequelize.getQueryInterface().dropTable(addSchemaTableName, {
        cascade: true,
      });

      // create table
      await db.sequelize.getQueryInterface().createTable(addSchemaTableName, rawAttributes);

      if (meta.inherits) {
        for (const inherit of lodash.uniq(meta.inherits)) {
          const tableNameQuoted = db.sequelize
            .getQueryInterface()
            .quoteIdentifiers(`${addSchemaTableName.schema}.${addSchemaTableName.tableName}`);
          const sql = `ALTER TABLE ${tableNameQuoted} INHERIT "${inherit}";`;
          await db.sequelize.query(sql);
        }
      }
    }

    // read file content from collection data
    const rows = await readLines(collectionDataPath);

    if (rows.length == 0) {
      app.logger.info(`${collectionName} has no data to import`);
      this.importedCollections.push(collectionName);
      return;
    }

    const rowsWithMeta = rows
      .map((row) =>
        JSON.parse(row)
          .map((val, index) => [columns[index], val])
          .reduce((carry, [column, val]) => {
            const field = fieldAttributes[column];

            carry[column] = field ? FieldValueWriter.write(field, val) : val;

            return carry;
          }, {}),
      )
      .filter((row) => {
        if (options.rowCondition) {
          return options.rowCondition(row);
        }

        return true;
      });

    if (rowsWithMeta.length == 0) {
      app.logger.info(`${collectionName} has no data to import`);
      this.importedCollections.push(collectionName);
      return;
    }

    //@ts-ignore
    const sql = db.sequelize.queryInterface.queryGenerator.bulkInsertQuery(
      addSchemaTableName,
      rowsWithMeta,
      {},
      lodash.mapKeys(rawAttributes, (value, key) => {
        return value.field;
      }),
    );

    if (options.insert === false) {
      return sql;
    }

    await app.db.sequelize.query(sql, {
      type: 'INSERT',
    });

    app.logger.info(`${collectionName} imported with ${rowsWithMeta.length} rows`);

    if (meta.autoIncrement) {
      const queryInterface = app.db.queryInterface;
      await queryInterface.setAutoIncrementVal({
        tableInfo: {
          name: meta.tableName,
          schema: meta.schema,
        },
        columnName: meta.autoIncrement.fieldName,
        seqName: meta.autoIncrement.seqName,
        currentVal: meta.autoIncrement.currentVal,
      });
    }

    this.importedCollections.push(collectionName);
  }

  async importDb() {
    const sqlFilePath = path.resolve(this.workDir, 'db.sql');
    // if db.sql file not exists, skip import
    if (!fs.existsSync(sqlFilePath)) {
      return;
    }

    // read file content from db.sql
    const queriesContent = await fsPromises.readFile(sqlFilePath, 'utf8');

    const queries = JSON.parse(queriesContent);

    for (const sql of queries) {
      try {
        this.app.log.info(`import sql: ${sql}`);
        await this.app.db.sequelize.query(sql);
      } catch (e) {
        if (e.name === 'SequelizeDatabaseError') {
          this.app.logger.error(e.message);
        } else {
          throw e;
        }
      }
    }
  }

  async upgradeApp() {
    await this.app.runCommand('upgrade');
  }
}
