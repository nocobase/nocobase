/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { DataSourceOptions, SequelizeDataSource } from '@nocobase/data-source-manager';
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

  private async tables2Collections(collectionNames: string[]) {
    const db = this.collectionManager.db;
    const results = (
      await Promise.all(
        collectionNames.map(async (tableName) => {
          const tableInfo: { tableName: string; schema?: string } = { tableName };

          if (db.options.schema) {
            tableInfo.schema = db.options.schema;
          }

          try {
            return await this.introspector.getCollection({ tableInfo });
          } catch (e) {
            if (e.message.includes('No description found for')) {
              this.logger.debug('Table description not found', {
                tableName,
                error: e.message,
              });
              return false;
            }

            this.logger.error('Failed to get collection', {
              tableName,
              error: e.message,
              stack: e.stack,
            });
            throw e;
          }
        }),
      )
    ).filter(Boolean);
    return results;
  }

  async loadTables(ctx: Context, tables: string[]) {
    const repo = this.collectionManager.db.getRepository('collections');
    const existsCollections = await repo.find({
      filter: { name: tables },
    });
    const existsCollectionNames = existsCollections.map((c: Model) => c.name);
    const addToCollections = tables.filter((table) => !existsCollectionNames.includes(table));
    if (addToCollections.length) {
      try {
        this.status = 'loading';
        const results = await this.tables2Collections(addToCollections);
        const values = results.map((result) => ({
          ...result,
          underscored: false,
        }));
        await repo.create({ values, context: ctx });
        this.status = 'loaded';
      } catch (e) {
        this.logger.error('Failed to load tables', {
          error: e.message,
          stack: e.stack,
        });
      }
    }
  }
}
