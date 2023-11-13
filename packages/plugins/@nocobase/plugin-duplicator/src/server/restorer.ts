import decompress from 'decompress';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { AppMigrator, AppMigratorOptions } from './app-migrator';
import { readLines } from './utils';
import { Application } from '@nocobase/server';
import { DataTypes, DumpDataType } from '@nocobase/database';
import lodash from 'lodash';
import { FieldValueWriter } from './field-value-writer';

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
    await this.importCollections(options);
    await this.importDb();
    await this.clearWorkDir();
  }

  async getImportMeta() {
    const metaFile = path.resolve(this.workDir, 'meta');
    return JSON.parse(await fsPromises.readFile(metaFile, 'utf8')) as any;
  }

  async importCollections(options: RestoreOptions) {
    const importCollection = async (collectionName: string) => {
      const collectionMetaPath = path.resolve(this.workDir, 'collections', collectionName, 'meta');

      const metaContent = await fsPromises.readFile(collectionMetaPath, 'utf8');
      const meta = JSON.parse(metaContent);
      const tableName = this.app.db.utils.quoteTable(meta.tableName);

      try {
        // disable trigger
        if (this.app.db.inDialect('postgres')) {
          await this.app.db.sequelize.query(`ALTER TABLE IF EXISTS ${tableName} DISABLE TRIGGER ALL`);
        }

        await this.importCollection({
          name: collectionName,
        });
      } catch (err) {
        console.log(err);
        this.app.log.warn(`import collection ${collectionName} failed`, {
          err,
        });
      } finally {
        if (this.app.db.inDialect('postgres')) {
          await this.app.db.sequelize.query(`ALTER TABLE IF EXISTS ${tableName} ENABLE TRIGGER ALL`);
        }
      }
    };

    const { dumpableCollectionsGroupByDataTypes, delayCollections } = await this.parseBackupFile();

    // import meta collections
    const metaCollections = dumpableCollectionsGroupByDataTypes.meta;

    for (const collection of metaCollections) {
      if (delayCollections.includes(collection.name)) {
        continue;
      }

      await importCollection(collection.name);
    }

    // // load imported collections into database object
    //
    // // sync database
    // await this.app.db.sync({
    //   force: false,
    //   alter: {
    //     drop: false,
    //   },
    // });

    if (options.dataTypes.has('config')) {
      const configCollections = dumpableCollectionsGroupByDataTypes.config;

      for (const collection of configCollections) {
        await importCollection(collection.name);
      }
    }

    if (options.dataTypes.has('business')) {
      const businessCollections = dumpableCollectionsGroupByDataTypes.business;

      for (const collection of businessCollections) {
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
    const dir = this.workDir;
    const collectionDataPath = path.resolve(dir, 'collections', collectionName, 'data');
    const collectionMetaPath = path.resolve(dir, 'collections', collectionName, 'meta');

    const metaContent = await fsPromises.readFile(collectionMetaPath, 'utf8');
    const meta = JSON.parse(metaContent);

    app.log.info(`collection meta ${metaContent}`);

    const addSchemaTableName = meta.tableName;
    const columns = meta['columns'];

    if (columns.length == 0) {
      app.logger.info(`${collectionName} has no columns`);
      return;
    }

    const fieldAttributes = lodash.mapValues(meta.attributes, (attr) => {
      if (attr.isCollectionField) {
        const fieldClass = db.fieldTypes.get(attr.type);
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
      await db.sequelize.getQueryInterface().dropTable(addSchemaTableName);

      // create table
      await db.sequelize.getQueryInterface().createTable(addSchemaTableName, rawAttributes);
    }

    // read file content from collection data
    const rows = await readLines(collectionDataPath);

    if (rows.length == 0) {
      app.logger.info(`${collectionName} has no data to import`);
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

    // const primaryKeyAttribute = collection.model.rawAttributes[collection.model.primaryKeyAttribute];
    //
    // if (primaryKeyAttribute && primaryKeyAttribute.autoIncrement) {
    //   this.on('restoreCollectionsFinished', async () => {
    //     if (this.app.db.inDialect('postgres')) {
    //       const sequenceNameResult = await app.db.sequelize.query(
    //         `SELECT column_default
    //          FROM information_schema.columns
    //          WHERE table_name = '${collection.model.tableName}'
    //            and "column_name" = 'id'
    //            and table_schema = '${app.db.options.schema || 'public'}';`,
    //       );
    //
    //       if (sequenceNameResult[0].length) {
    //         const columnDefault = sequenceNameResult[0][0]['column_default'];
    //         if (columnDefault.includes(`${collection.model.tableName}_id_seq`)) {
    //           const regex = new RegExp(/nextval\('(.*)'::regclass\)/);
    //           const match = regex.exec(columnDefault);
    //           const sequenceName = match[1];
    //
    //           const maxVal = await app.db.sequelize.query(
    //             `SELECT MAX("${primaryKeyAttribute.field}")
    //              FROM ${tableName}`,
    //             {
    //               type: 'SELECT',
    //             },
    //           );
    //
    //           const updateSeqSQL = `SELECT setval('${sequenceName}', ${maxVal[0]['max']})`;
    //           await app.db.sequelize.query(updateSeqSQL);
    //         }
    //       }
    //     }
    //
    //     if (this.app.db.inDialect('sqlite')) {
    //       await app.db.sequelize.query(
    //         `UPDATE sqlite_sequence
    //          set seq = (SELECT MAX("${primaryKeyAttribute.field}") FROM "${collection.model.tableName}")
    //          WHERE name = "${collection.model.tableName}"`,
    //       );
    //     }
    //   });
    // }

    app.logger.info(`${collectionName} imported with ${rowsWithMeta.length} rows`);

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
}
