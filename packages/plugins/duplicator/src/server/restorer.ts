import { AppMigrator } from './app-migrator';
import path from 'path';
import fsPromises from 'fs/promises';
import { readLines, sqlAdapter } from './utils';
import decompress from 'decompress';
import { FieldValueWriter } from './field-value-writer';
import inquirer from 'inquirer';
import { CollectionGroupManager } from './collection-group-manager';

export class Restorer extends AppMigrator {
  direction = 'restore' as const;

  importedCollections: string[] = [];

  async restore(backupFilePath: string) {
    const results = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Danger !!! This action will overwrite your current data, please make sure you have a backup❗️❗️',
        default: false,
      },
    ]);

    if (results.confirm !== true) {
      return;
    }

    await this.decompressBackup(backupFilePath);
    await this.importCollections();
    await this.clearWorkDir();
  }

  async getImportPlugins() {
    const meta = await this.getImportCollectionMeta('applicationPlugins');
    const nameIndex = meta.columns.indexOf('name');

    const plugins = await this.getImportCollectionData('applicationPlugins');
    return plugins.map((plugin) => JSON.parse(plugin)[nameIndex]);
  }

  async getImportCustomCollections() {
    const collections = await this.getImportCollections();
    const meta = await this.getImportCollectionMeta('collections');
    const data = await this.getImportCollectionData('collections');

    return data
      .map((row) => JSON.parse(row)[meta.columns.indexOf('name')])
      .filter((name) => collections.includes(name));
  }

  async getImportCollections() {
    const collectionsDir = path.resolve(this.workDir, 'collections');
    const collections = await fsPromises.readdir(collectionsDir);
    return collections;
  }

  async getImportCollectionData(collectionName) {
    const dataFile = path.resolve(this.workDir, 'collections', collectionName, 'data');
    return await readLines(dataFile);
  }

  async getImportCollectionMeta(collectionName) {
    const metaData = path.resolve(this.workDir, 'collections', collectionName, 'meta');
    const meta = JSON.parse(await fsPromises.readFile(metaData, 'utf8'));
    return meta;
  }

  async importCollections(options?: { ignore?: string | string[] }) {
    const coreCollections = ['applicationPlugins'];
    const collections = await this.getImportCollections();

    const importCustomCollections = await this.getImportCustomCollections();

    const importPlugins = await this.getImportPlugins();

    const collectionGroups = CollectionGroupManager.collectionGroups.filter((collectionGroup) => {
      return (
        importPlugins.includes(collectionGroup.pluginName) &&
        collectionGroup.collections.every((collectionName) => collections.includes(collectionName))
      );
    });

    const delayGroups = CollectionGroupManager.getDelayRestoreCollectionGroups();
    const delayCollections = CollectionGroupManager.getGroupsCollections(delayGroups);

    const { requiredGroups, optionalGroups } = CollectionGroupManager.classifyCollectionGroups(collectionGroups);
    const pluginsCollections = CollectionGroupManager.getGroupsCollections(collectionGroups);

    const optionalCollections = importCustomCollections.filter(
      (collection) => !pluginsCollections.includes(collection) && !coreCollections.includes(collection),
    );

    const questions = this.buildInquirerQuestions(requiredGroups, optionalGroups, optionalCollections);

    const results = await inquirer.prompt(questions);

    // import plugins
    await this.importCollection({
      name: 'applicationPlugins',
    });

    await this.app.reload();

    const requiredCollections = CollectionGroupManager.getGroupsCollections(requiredGroups).filter(
      (collection) => !delayCollections.includes(collection),
    );

    // import required plugins collections
    for (const collectionName of requiredCollections) {
      await this.importCollection({
        name: collectionName,
      });
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

    const userCollections = results.userCollections || [];
    const throughCollections = this.findThroughCollections(userCollections);

    const customCollections = [
      ...CollectionGroupManager.getGroupsCollections(results.collectionGroups),
      ...userCollections,
      ...throughCollections,
    ];

    // import custom collections
    for (const collectionName of customCollections) {
      await this.importCollection({
        name: collectionName,
      });
    }

    // import delay groups
    for (const collectionGroup of delayGroups) {
      await collectionGroup.delayRestore(this);
    }
  }

  async decompressBackup(backupFilePath: string) {
    await decompress(backupFilePath, this.workDir);
  }

  async importCollection(options: {
    name: string;
    insert?: boolean;
    clear?: boolean;
    rowCondition?: (row: any) => boolean;
  }) {
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

    const primaryKeyAttribute = collection.model.rawAttributes[collection.model.primaryKeyAttribute];

    if (primaryKeyAttribute && primaryKeyAttribute.autoIncrement) {
      if (this.app.db.inDialect('postgres')) {
        await app.db.sequelize.query(
          `SELECT pg_catalog.setval(pg_get_serial_sequence('"${collection.model.tableName}"', '${primaryKeyAttribute.field}'), MAX("${primaryKeyAttribute.field}")) FROM "${collection.model.tableName}"`,
        );
      }
    }

    app.logger.info(`${collectionName} imported with ${rowsWithMeta.length} rows`);

    this.importedCollections.push(collection.name);
  }
}
