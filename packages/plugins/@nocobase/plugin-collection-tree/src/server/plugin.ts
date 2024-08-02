/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Collection, Model, SyncOptions, AdjacencyListRepository, DestroyOptions } from '@nocobase/database';
import { DataSource, SequelizeCollectionManager, SequelizeDataSource } from '@nocobase/data-source-manager';

class PluginCollectionTreeServer extends Plugin {
  async beforeLoad() {
    const condition = (options) => {
      return options.tree;
    };

    this.app.db.collectionFactory.registerCollectionType(TreeCollection, {
      condition,
    });

    this.app.dataSourceManager.afterAddDataSource((dataSource: DataSource) => {
      const collectionManager = dataSource.collectionManager;
      if (collectionManager instanceof SequelizeCollectionManager) {
        collectionManager.db.on('afterDefineCollection', (collection: Model) => {
          if (!condition(collection.options)) {
            return;
          }
          const name = `${dataSource.name}_${collection.name}_path`;

          //always define tree path collection
          this.defineTreePathCollection(name, collectionManager);

          //sync exist tree collection path table
          this.db.on(`${name}.afterSync`, async (collection: Model) => {
            await this.syncExistTreeCollectionPathTable();
          });

          //afterSync
          collectionManager.db.on(`${collection.name}.afterSync`, async (collection: Model) => {
            // trigger tree path collection creat logic
            await this.db.getCollection(name).sync({ transaction: collection.transaction } as SyncOptions);
            const treePathCollection = await this.app.db.getCollection(name);
            let treeExistsInDb = false;
            if (treePathCollection) {
              treeExistsInDb = await treePathCollection.existsInDb();
            }
            if (!treeExistsInDb) {
              await this.db
                .getCollection(name)
                .sync({ transaction: collection.transaction, force: false, alter: true } as SyncOptions);
            }
          });

          //afterCreate
          this.db.on(`${collection.name}.afterCreate`, async (model: Model, options) => {
            const { transaction } = options;
            let path = `/${model.get(collection.filterTargetKey)}`;
            path = await this.getTreePath(model, path, collection);
            await this.app.db.getRepository(name).create({
              values: {
                nodePk: model.get(collection.filterTargetKey),
                path: path,
                rootPk: path.split('/')[1],
              },
              transaction,
            });
          });

          //afterUpdate
          this.db.on(`${collection.name}.afterUpdate`, async (model: Model, options) => {
            // only update parentId and filterTargetKey
            if (!(model._changed.has(collection.filterTargetKey) || model._changed.has('parentId'))) {
              return;
            }
            const { transaction } = options;
            let path = `/${model.get(collection.filterTargetKey)}`;
            path = await this.getTreePath(model, path, collection);
            const collectionTreePath = await this.app.db.getCollection(name);
            const nodePkColumnName = collectionTreePath.getField('nodePk').columnName();
            await this.app.db.getRepository(name).update({
              values: {
                path,
                rootPk: path.split('/')[1],
              },
              filter: {
                [nodePkColumnName]: model.get(collection.filterTargetKey),
              },
              transaction,
            });
          });

          //afterDestroy
          this.db.on(`${collection.name}.afterDestroy`, async (model: Model, options: DestroyOptions) => {
            await this.app.db.getRepository(name).destroy({
              filter: {
                nodePk: model.get(collection.filterTargetKey),
              },
              transaction: options.transaction,
            });
          });
        });
      }
    });

    this.db.on('collections.afterDestroy', async (collection: Model, { transaction }) => {
      const name = `main_${collection.get('name')}_path`;
      if (!condition(collection.options)) {
        return;
      }

      const collectionTree = await this.db.getCollection(name);
      if (collectionTree) {
        await this.db.getCollection(name).removeFromDb({ transaction });
      }
    });
  }

  private async syncExistTreeCollectionPathTable() {
    const collectionsRepository = this.app.db.getRepository('collections');
    if (!collectionsRepository) {
      return;
    }
    const treeCollections = await this.app.db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        'options.tree': 'adjacencyList',
      },
    });
    for (const collection of treeCollections) {
      const name = `main_${collection.name}_path`;
      const treePathCollection = this.app.db.getCollection(name);
      if (!treePathCollection) {
        this.app.db.collection({
          name,
          autoGenId: false,
          timestamps: false,
          fields: [
            { type: 'integer', name: 'nodePk' },
            { type: 'jsonb', name: 'path' },
            { type: 'integer', name: 'rootPk' },
          ],
        });
      }
      const treeExistsInDb = await this.app.db.getCollection(name).existsInDb();
      if (!treeExistsInDb) {
        await this.app.db.getCollection(name).sync({ force: false, alter: true });
        const treeCollection = this.app.db.getCollection(collection.name);
        const existData = await this.app.db.getRepository(collection.name).find({});
        for (const data of existData) {
          let path = `/${data.get(treeCollection.filterTargetKey)}`;
          path = await this.getTreePath(data, path, treeCollection as unknown as Model);
          await this.app.db.getRepository(name).create({
            values: {
              nodePk: data.get(treeCollection.filterTargetKey),
              path: path,
              rootPk: path.split('/')[1],
            },
          });
        }
      }
    }
  }

  private async defineTreePathCollection(name: string, collectionManager: SequelizeCollectionManager) {
    this.db.collection({
      name,
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'integer', name: 'nodePk' },
        { type: 'jsonb', name: 'path' },
        { type: 'integer', name: 'rootPk' },
      ],
    });
  }

  private async getTreePath(model: Model, path: string, collection: Model) {
    if (model.dataValues?.parentId !== null) {
      const parent = await this.app.db.getRepository(collection.name).findOne({
        filter: {
          [collection.filterTargetKey]: model.dataValues?.parentId,
        },
      });
      if (parent) {
        path = `/${parent.get(collection.filterTargetKey)}${path}`;
        if (parent.dataValues?.parentId !== null) {
          path = await this.getTreePath(parent, path, collection);
        }
      }
    }
    return path;
  }
}

class TreeCollection extends Collection {
  setRepository() {
    this.repository = new AdjacencyListRepository(this);
  }
}

export default PluginCollectionTreeServer;
