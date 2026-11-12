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
  SequelizeDataSource,
  tableInfo,
} from '@nocobase/data-source-manager';
import { Collection, Model } from '@nocobase/database';
import { QueryTypes } from 'sequelize';

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

  private async readTable(table: string | tableInfo): Promise<CollectionOptions | null> {
    const info =
      typeof table === 'string' ? { tableName: table, schema: this.collectionManager.db.options.schema } : table;
    try {
      return await this.introspector.getCollection({ tableInfo: info });
    } catch (e) {
      if (e.message.includes('No description found for')) {
        return null;
      }
      throw e;
    }
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
        const results = (await Promise.all(toAddTables.map((table) => this.readTable(table)))).filter(Boolean);
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

  private async getLoadedCollections(names?: string[]) {
    const db = this.collectionManager.db;
    const loadedCollections = await db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        hidden: false,
        ...(names?.length ? { name: names } : {}),
      },
    });
    return loadedCollections.filter((collection: Model) => !['db2cm', 'dbsync'].includes(collection.options?.from));
  }

  private async getPureInheritedColumns(collection: Collection) {
    const rows = await collection.db.sequelize.query<{ attname: string }>(
      `SELECT a.attname FROM pg_catalog.pg_attribute a
       JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = :schema AND c.relname = :table AND a.attnum > 0 AND NOT a.attisdropped
         AND a.attinhcount > 0 AND NOT a.attislocal`,
      {
        type: QueryTypes.SELECT,
        replacements: { schema: collection.collectionSchema(), table: collection.model.tableName },
      },
    );
    return new Set(rows.map(({ attname }) => attname));
  }

  async syncFieldsFromDatabase(ctx: Context, collectionNames?: string[]) {
    const db = this.collectionManager.db;
    const loadedCollections = await this.getLoadedCollections(collectionNames);
    const currentSchema = process.env.COLLECTION_MANAGER_SCHEMA || db.options.schema || 'public';

    // Keep the logical collection paired with its physical table, including when schemas reuse a table name.
    const sources = await Promise.all(
      loadedCollections.map(async (loaded: Model) => {
        const collection = db.getCollection(loaded.name);
        const incoming = await this.readTable(collection.getTableNameWithSchema());
        const inherited =
          incoming && db.inDialect('postgres') && collection.isInherited()
            ? await this.getPureInheritedColumns(collection)
            : new Set<string>();
        return { loaded, collection, incoming, inherited };
      }),
    );

    for (const { loaded, collection, incoming, inherited } of sources) {
      if (!incoming) continue;
      const configuredFields: FieldOptions[] = [];
      const inheritedOverrides: FieldOptions[] = [];
      for (const field of loaded.fields as Model[]) {
        const options = field.toJSON<FieldOptions>();
        const columnName = collection.getField(options.name)?.columnName();
        if (inherited.has(columnName || options.field || options.name)) {
          inheritedOverrides.push(options);
        } else {
          configuredFields.push({ columnName, ...options });
        }
      }

      // Only child-owned columns participate in the diff. An existing override of an inherited column
      // has no independently defined storage; keep the user's configuration verbatim.
      incoming.fields = incoming.fields.filter((field) => !inherited.has(field.field || field.name));
      const [values] = this.mergeWithLoadedCollections([incoming], {
        [incoming.name]: { ...loaded.toJSON(), name: collection.name, fields: configuredFields },
      });
      values.fields.push(...inheritedOverrides);
      if (values.schema === currentSchema) {
        delete values.schema;
      }

      const deletedFields = configuredFields.filter((field) => !values.fields.some((f) => f.name === field.name));

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
