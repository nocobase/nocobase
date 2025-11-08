/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { CollectionOptions, DataSourceOptions, SequelizeDataSource } from '@nocobase/data-source-manager';
import { Collection, Model } from '@nocobase/database';

type MainDataSourceStatus = 'loaded' | 'loading';

export class MainDataSource extends SequelizeDataSource {
  status: MainDataSourceStatus = 'loaded';

  init(options: DataSourceOptions = {}) {
    const { acl, resourceManager, database } = options;

    this.acl = acl;
    this.resourceManager = resourceManager;

    this.collectionManager = this.createCollectionManager({
      collectionManager: {
        database,
        collectionsFilter: (collection) => {
          return collection.options.loadedFromCollectionManager;
        },
      },
    });

    if (options.useACL !== false) {
      this.resourceManager.use(this.acl.middleware(), { group: 'acl', after: 'auth' });
    }
  }

  async readTables() {
    const allTables = await this.introspector.getTableList();
    const existsCollections = this.collectionManager.db.collections;
    const existsTables = Array.from(existsCollections.values()).map(
      (collection: Collection) => collection.model.tableName,
    );
    const diffTables = allTables.filter((table) => !existsTables.includes(table));
    return diffTables.map((name) => ({ name }));
  }

  private async tables2Collections(
    tableNames: (
      | string
      | {
          tableName: string;
          schema?: string;
        }
    )[],
  ): Promise<CollectionOptions[]> {
    const db = this.collectionManager.db;
    const results = await Promise.all(
      tableNames.map(async (tableName) => {
        let tableInfo: { tableName: string; schema?: string };
        if (typeof tableName === 'string') {
          tableInfo = { tableName };
          if (db.options.schema) {
            tableInfo.schema = db.options.schema;
          }
        } else {
          tableInfo = tableName;
        }

        try {
          return await this.introspector.getCollection({ tableInfo });
        } catch (e) {
          if (e.message.includes('No description found for')) {
            return null;
          }

          throw e;
        }
      }),
    );
    return results.filter(Boolean);
  }

  async loadTables(ctx: Context, tables: string[]) {
    const repo = this.collectionManager.db.getRepository('collections');
    const existsCollections = this.collectionManager.db.collections;
    const existsTables = Array.from(existsCollections.values()).map(
      (collection: Collection) => collection.model.tableName,
    );
    const toAddTables = tables.filter((table) => !existsTables.includes(table));
    if (toAddTables.length) {
      try {
        this.status = 'loading';
        const results = await this.tables2Collections(toAddTables);
        const values = results.map((result) => ({
          ...result,
          underscored: false,
        }));
        await repo.create({ values, context: ctx });
      } catch (e) {
        throw e;
      } finally {
        this.status = 'loaded';
      }
    }
  }

  private async getLoadedCollections(filter?: any) {
    const db = this.collectionManager.db;
    const loadedCollections = await db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        hidden: false,
        ...filter,
      },
    });
    const collections = loadedCollections.filter((collection: Model) => collection.options?.from !== 'db2cm');
    const loadedData = {};
    for (const collection of collections) {
      const c = db.getCollection(collection.name);
      loadedData[c.tableName()] = {
        ...collection.toJSON(),
        fields: collection.fields.map((field: Model) => {
          const f = c.getField(field.name);
          return {
            columnName: f?.columnName(),
            ...field.toJSON(),
          };
        }),
      };
    }
    return loadedData;
  }

  async syncFieldsFromDatabase(ctx: any, collectionNames?: string[]) {
    let filter = {};
    if (collectionNames?.length) {
      filter = {
        name: collectionNames,
      };
    }
    const db = this.collectionManager.db;
    const loadedCollections = await this.getLoadedCollections(filter);
    const tableNames = Object.values(loadedCollections).map(({ name }) => {
      const collection = db.getCollection(name);
      return collection.getTableNameWithSchema();
    });
    let collections = [];
    try {
      collections = await this.tables2Collections(tableNames);
    } catch (err) {
      ctx.log.error(err);
    }
    const toLoadCollections = this.mergeWithLoadedCollections(collections, loadedCollections);

    for (const values of toLoadCollections) {
      const existsFields = loadedCollections[values.tableName].fields;
      const deletedFields = existsFields.filter((field: any) => !values.fields.find((f) => f.name === field.name));

      await db.sequelize.transaction(async (transaction) => {
        for (const field of deletedFields) {
          await db.getRepository('fields').destroy({
            filterByTk: field.key,
            context: ctx,
            transaction,
          });
        }

        await db.getRepository('collections').update({
          filterByTk: values.name,
          values,
          updateAssociationValues: ['fields'],
          context: ctx,
          transaction,
        });
      });
    }
  }
}
