import decompress from 'decompress';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { AppMigrator, AppMigratorOptions } from './app-migrator';
import { CollectionGroupManager } from './collection-group-manager';
import { FieldValueWriter } from './field-value-writer';
import { readLines, sqlAdapter } from './utils';
import { Application } from '@nocobase/server';

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

  setBackUpFilePath(backUpFilePath) {
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

  async restore(options: { selectedOptionalGroupNames: string[]; selectedUserCollections: string[] }) {
    await this.decompressBackup(this.backUpFilePath);
    await this.importCollections(options);
    await this.importDb();
    await this.clearWorkDir();
  }

  async getImportPlugins() {
    const meta = await this.getImportCollectionMeta('applicationPlugins');
    const nameIndex = meta.columns.indexOf('name');

    const plugins = await this.getImportCollectionData('applicationPlugins');
    return ['core', ...plugins.map((plugin) => JSON.parse(plugin)[nameIndex])];
  }

  async getImportCustomCollections() {
    const collections = await this.getImportCollections();
    const meta = await this.getImportCollectionMeta('collections');
    const data = await this.getImportCollectionData('collections');

    return data
      .map((row) => JSON.parse(row)[meta.columns.indexOf('name')])
      .filter((name) => collections.includes(name));
  }

  async getImportCollectionTitle(collectionName) {
    const meta = await this.getImportCollectionMeta('collections');
    const data = await this.getImportCollectionData('collections');

    const index = meta.columns.indexOf('name');
    const row = data.find((row) => JSON.parse(row)[index] === collectionName);

    if (!row) {
      throw new Error(`Collection ${collectionName} not found`);
    }

    const titleIndex = meta.columns.indexOf('title');

    return JSON.parse(row)[titleIndex];
  }

  async getImportCollections() {
    const collectionsDir = path.resolve(this.workDir, 'collections');
    return await fsPromises.readdir(collectionsDir);
  }

  async getImportCollectionData(collectionName) {
    const dataFile = path.resolve(this.workDir, 'collections', collectionName, 'data');
    return await readLines(dataFile);
  }

  async getImportCollectionMeta(collectionName) {
    const metaData = path.resolve(this.workDir, 'collections', collectionName, 'meta');
    return JSON.parse(await fsPromises.readFile(metaData, 'utf8'));
  }

  async getImportMeta() {
    const metaFile = path.resolve(this.workDir, 'meta');
    return JSON.parse(await fsPromises.readFile(metaFile, 'utf8')) as any;
  }

  async importCollections(options: {
    ignore?: string | string[];
    selectedOptionalGroupNames: string[];
    selectedUserCollections: string[];
  }) {
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
        this.app.log.warn(`import collection ${collectionName} failed`, {
          err,
        });
      } finally {
        if (this.app.db.inDialect('postgres')) {
          await this.app.db.sequelize.query(`ALTER TABLE IF EXISTS ${tableName} ENABLE TRIGGER ALL`);
        }
      }
    };

    // import applicationPlugins first
    await importCollection('applicationPlugins');
    // reload app
    await this.app.reload();

    const { requiredGroups, selectedOptionalGroups } = await this.parseBackupFile();

    const delayGroups = [...requiredGroups, ...selectedOptionalGroups].filter((group) => group.delay);
    const delayCollections = CollectionGroupManager.getGroupsCollections(delayGroups);

    // import required plugins collections
    for (const collectionName of CollectionGroupManager.getGroupsCollections(requiredGroups).filter(
      (i) => !delayCollections.includes(i) && i != 'applicationPlugins',
    )) {
      await importCollection(collectionName);
    }

    // load imported collections into database object
    await (this.app.db.getRepository('collections') as any).load();

    // sync database
    await this.app.db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });

    const userCollections = options.selectedUserCollections || [];
    const throughCollections = this.findThroughCollections(userCollections);

    const customCollections = [
      ...CollectionGroupManager.getGroupsCollections(
        selectedOptionalGroups.filter((group) => {
          return options.selectedOptionalGroupNames.some((selectedOptionalGroupName) => {
            const [namespace, functionKey] = selectedOptionalGroupName.split('.');
            return group.function === functionKey && group.namespace === namespace;
          });
        }),
      ),
      ...userCollections,
      ...throughCollections,
    ];

    // import custom collections
    for (const collectionName of customCollections) {
      await importCollection(collectionName);
    }

    // import delay groups
    const appGroups = CollectionGroupManager.getGroups(this.app);

    for (const collectionGroup of delayGroups) {
      const appCollectionGroup = appGroups.find(
        (group) => group.namespace === collectionGroup.name && group.function === collectionGroup.function,
      );
      await appCollectionGroup.delayRestore(this);
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
    const collection = app.db.getCollection(collectionName);
    const collectionDataPath = path.resolve(dir, 'collections', collectionName, 'data');
    const collectionMetaPath = path.resolve(dir, 'collections', collectionName, 'meta');

    const metaContent = await fsPromises.readFile(collectionMetaPath, 'utf8');
    const meta = JSON.parse(metaContent);
    app.log.info(`collection meta ${metaContent}`);

    const addSchemaTableName = db.utils.addSchema(meta.tableName);
    const tableName = db.utils.quoteTable(meta.tableName);

    if (options.clear !== false) {
      // truncate old data
      let sql = `TRUNCATE TABLE ${tableName}`;

      if (app.db.inDialect('sqlite')) {
        sql = `DELETE
               FROM ${tableName}`;
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

    const rowsWithMeta = rows
      .map((row) =>
        JSON.parse(row)
          .map((val, index) => [columns[index], val])
          .reduce((carry, [column, val]) => {
            const field = fields[column];

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

    const model = collection.model;

    const fieldMappedAttributes = {};
    // @ts-ignore
    for (const attr in model.tableAttributes) {
      fieldMappedAttributes[model.rawAttributes[attr].field || attr] = model.rawAttributes[attr];
    }

    //@ts-ignore
    const sql = collection.model.queryInterface.queryGenerator.bulkInsertQuery(
      addSchemaTableName,
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

    const primaryKeyAttribute = collection.model.rawAttributes[collection.model.primaryKeyAttribute];

    if (primaryKeyAttribute && primaryKeyAttribute.autoIncrement) {
      this.on('restoreCollectionsFinished', async () => {
        if (this.app.db.inDialect('postgres')) {
          const sequenceNameResult = await app.db.sequelize.query(
            `SELECT column_default
             FROM information_schema.columns
             WHERE table_name = '${collection.model.tableName}'
               and "column_name" = 'id'
               and table_schema = '${app.db.options.schema || 'public'}';`,
          );

          if (sequenceNameResult[0].length) {
            const columnDefault = sequenceNameResult[0][0]['column_default'];
            if (columnDefault.includes(`${collection.model.tableName}_id_seq`)) {
              const regex = new RegExp(/nextval\('(.*)'::regclass\)/);
              const match = regex.exec(columnDefault);
              const sequenceName = match[1];

              const maxVal = await app.db.sequelize.query(
                `SELECT MAX("${primaryKeyAttribute.field}")
                 FROM ${tableName}`,
                {
                  type: 'SELECT',
                },
              );

              const updateSeqSQL = `SELECT setval('${sequenceName}', ${maxVal[0]['max']})`;
              await app.db.sequelize.query(updateSeqSQL);
            }
          }
        }

        if (this.app.db.inDialect('sqlite')) {
          await app.db.sequelize.query(
            `UPDATE sqlite_sequence
             set seq = (SELECT MAX("${primaryKeyAttribute.field}") FROM "${collection.model.tableName}")
             WHERE name = "${collection.model.tableName}"`,
          );
        }
      });
    }

    app.logger.info(`${collectionName} imported with ${rowsWithMeta.length} rows`);

    this.importedCollections.push(collection.name);
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
