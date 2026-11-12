/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import {
  CollectionOptions,
  DataSourceOptions,
  FieldOptions,
  LoadedCollectionOptions,
  SequelizeDataSource,
} from '@nocobase/data-source-manager';
import { Collection, Model } from '@nocobase/database';

type MainDataSourceStatus = 'loaded' | 'loading';
type LoadedMainField = FieldOptions & { key: string; columnName?: string };
type LoadedMainCollection = LoadedCollectionOptions & { fields: LoadedMainField[] };

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
          from: 'dbsync',
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

  private async getLoadedCollections(filter?: { name?: string[] }) {
    const db = this.collectionManager.db;
    const loadedCollections: Model[] = await db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        hidden: false,
        ...filter,
      },
    });
    const collections = loadedCollections.filter((collection: Model) => collection.options?.from !== 'db2cm');
    const loadedData: Record<string, LoadedMainCollection> = {};
    for (const collection of collections) {
      const options = collection.toJSON<LoadedMainCollection>();
      const c = db.getCollection(options.name);
      loadedData[options.name] = {
        ...options,
        fields: (collection.get('fields') as Model[]).map((field) => {
          const fieldOptions = field.toJSON<LoadedMainField>();
          const f = c.getField(fieldOptions.name);
          return {
            ...fieldOptions,
            columnName: f?.columnName(),
          };
        }),
      };
    }
    return loadedData;
  }

  async syncFieldsFromDatabase(ctx: Context, collectionNames?: string[]) {
    let filter = {};
    if (collectionNames?.length) {
      filter = {
        name: collectionNames,
      };
    }
    const db = this.collectionManager.db;
    const loadedCollections = await this.getLoadedCollections(filter);
    const currentSchema = process.env.COLLECTION_MANAGER_SCHEMA || db.options.schema || 'public';
    // Pair each introspection result with its existing logical collection, including prefixed tables and renamed views.
    const syncPlans = await Promise.all(
      Object.values(loadedCollections).map(async (loadedCollection) => {
        const collection = db.getCollection(loadedCollection.name);
        const [incoming] = await this.tables2Collections([collection.getTableNameWithSchema()]);
        if (!incoming) {
          ctx.throw(
            400,
            ctx.t('Cannot synchronize collection "{{collection}}" because its database table could not be found.', {
              collection: loadedCollection.name,
              ns: 'data-source-main',
            }),
          );
        }

        const unsupportedColumns = new Map((incoming.unsupportedFields || []).map((field) => [field.name, field]));
        for (const field of loadedCollection.fields) {
          const unsupportedColumn = unsupportedColumns.get(field.columnName || field.field || field.name);
          if (unsupportedColumn) {
            ctx.throw(
              400,
              ctx.t(
                'Cannot synchronize field "{{field}}" in collection "{{collection}}": database type "{{type}}" is not supported.',
                {
                  field: field.name,
                  collection: loadedCollection.name,
                  type: unsupportedColumn.rawType,
                  ns: 'data-source-main',
                },
              ),
            );
          }
        }

        const physicalColumns = new Set([
          ...incoming.fields.map((field) => field.field || field.name),
          ...unsupportedColumns.keys(),
        ]);
        const [values] = this.mergeWithLoadedCollections([{ ...incoming, name: loadedCollection.name }], {
          [loadedCollection.name]: loadedCollection,
        });
        if (values.schema === currentSchema) {
          delete values.schema;
        }

        const deletedFields = loadedCollection.fields.filter(
          (field) => !values.fields.some((f) => f.name === field.name),
        );
        for (const field of deletedFields) {
          if (physicalColumns.has(field.columnName || field.field || field.name)) {
            ctx.throw(
              400,
              ctx.t(
                'Cannot remove field "{{field}}" from collection "{{collection}}" because its database column still exists.',
                { field: field.name, collection: loadedCollection.name, ns: 'data-source-main' },
              ),
            );
          }
        }
        return { values, deletedFields };
      }),
    );

    // Validate every collection before starting writes so a rejected batch leaves all field metadata intact.
    for (const { values, deletedFields } of syncPlans) {
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
