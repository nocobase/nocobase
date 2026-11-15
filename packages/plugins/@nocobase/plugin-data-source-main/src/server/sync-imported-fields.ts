/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { DataTypes, Transaction } from 'sequelize';
import { MainDataSource } from '@nocobase/server';
import { CollectionModel } from './models/collection';
import PluginDataSourceMainServer from './server';

// Imported tables are managed by their database owner. Register new columns without running schema migrations.
export async function syncImportedFields(ctx: Context, collectionNames?: string[]) {
  const db = ctx.db;
  const source = ctx.app.dataSourceManager.get('main') as MainDataSource;
  const plugin = ctx.app.pm.get('data-source-main') as PluginDataSourceMainServer;
  const collections = await db.getRepository('collections').find({
    filter: { hidden: false, 'options.from': 'dbsync', ...(collectionNames?.length ? { name: collectionNames } : {}) },
  });

  for (const candidate of collections) {
    const collection = db.getCollection(candidate.name);
    const incoming = await source.introspector.getCollection({
      tableInfo: { tableName: collection.model.tableName, schema: collection.collectionSchema() },
    });
    // SQLite has no row locks; acquire its write lock before reading existing metadata.
    const transactionOptions = db.inDialect('sqlite') ? { type: Transaction.TYPES.IMMEDIATE } : {};
    const shouldLoad = await db.sequelize.transaction(transactionOptions, async (transaction) => {
      // Serialize additions for this collection, including requests from other application instances.
      const model = await db.getModel('collections').findOne({
        where: { name: candidate.name },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!model || model.get('from') !== 'dbsync') return false;

      const fields = await db.getRepository('fields').find({
        filter: { collectionName: candidate.name },
        transaction,
      });
      const mappedColumns = new Set(
        fields
          .map((field) => db.buildField(field.toJSON(), { database: db, collection }))
          .filter(
            (field) =>
              !field.isRelationField() &&
              field.dataType &&
              field.dataType !== DataTypes.VIRTUAL &&
              !(field.dataType instanceof DataTypes.VIRTUAL),
          )
          .map((field) => field.columnName()),
      );
      const additions = incoming.fields.filter((field) => !mappedColumns.has(field.field || field.name));
      const existingNames = new Set(fields.map((field) => field.name));
      for (const field of additions) {
        if (existingNames.has(field.name)) {
          ctx.throw(
            400,
            ctx.t(
              'Cannot add database column "{{field}}" because the field name is already used in "{{collection}}".',
              {
                ns: 'data-source-main',
                field: field.name,
                collection: candidate.name,
              },
            ),
          );
        }
      }
      for (const field of additions) {
        // Keep validation hooks but omit context to avoid field loading and collection.sync() before commit.
        await db.getRepository('fields').create({
          values: { ...field, collectionName: candidate.name },
          transaction,
        });
      }
      return true;
    });
    if (shouldLoad) {
      await (candidate as CollectionModel).load();
      await plugin.sendSyncMessage({ type: 'syncCollection', collectionName: candidate.name });
    }
  }
}
