/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Plugin } from '@nocobase/server';
import { JSONDocumentField } from './json-document-field';
import { JSONCollection } from './json-collection';
import { syncJSONCollection } from './hooks/sync-json-collection';
import { destroyJSONCollection } from './hooks/destroy-json-collection';
import { syncExternalJSONCollection } from './hooks/sync-external-json-collection';

export class PluginFieldJSONDocumentServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
      const collectionManager = dataSource.collectionManager;
      if (collectionManager instanceof SequelizeCollectionManager) {
        collectionManager.registerFieldTypes({
          JSONDocument: JSONDocumentField,
        });

        collectionManager.db.collectionFactory.registerCollectionType(JSONCollection, {
          condition: (options) => {
            return options.json;
          },

          async onSync() {
            return;
          },

          async onDump() {
            return;
          },
        });
      }
    });

    this.app.dataSourceManager.afterAddDataSource(async (dataSource: DataSource) => {
      if (dataSource.name === 'main') {
        return;
      }
      const collectionManager = dataSource.collectionManager;
      const repo = this.db.getRepository('dataSourcesCollections');
      const JSONCollections = await repo.find({
        filter: {
          dataSourceKey: dataSource.name,
          'options.json': true,
        },
        appends: ['fields'],
      });
      JSONCollections.forEach((collection: any) => {
        const c = collection.toJSON();
        collectionManager.defineCollection({
          ...c.options,
          ...c,
          fields: c.fields.map((field: any) => {
            return {
              ...field.options,
              ...field,
            };
          }),
        });
      });
    });

    this.db.on('fields.beforeSave', syncJSONCollection(this.db));
    this.db.on('fields.afterDestroy', destroyJSONCollection(this.db));
    this.db.on('dataSourcesFields.beforeSave', syncExternalJSONCollection(this.app, this.db));
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldJSONDocumentServer;
