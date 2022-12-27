import { AppMigrator } from './app-migrator';
import path from 'path';
import fsPromises from 'fs/promises';
import { readLines, sqlAdapter } from './utils';
import lodash from 'lodash';
import decompress from 'decompress';
import { FieldValueWriter } from './field-value-writer';
import inquirer from 'inquirer';
import { CollectionGroupManager } from './collection-group-manager';

const optionsPlugins = ['users'];

export class Restorer extends AppMigrator {
  direction = 'restore' as const;

  async restore(backupFilePath: string) {
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

    // import required collection
    for (const collectionName of CollectionGroupManager.getGroupsCollections(requiredGroups)) {
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

    // import custom collections
    for (const collectionName of [
      ...CollectionGroupManager.getGroupsCollections(results.collectionGroups),
      ...(results.userCollections || []),
    ]) {
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
          const field = fields[column];

          carry[column] = field ? FieldValueWriter.write(field, val) : val;

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
