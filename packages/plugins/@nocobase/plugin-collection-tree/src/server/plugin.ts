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
          if (!collection.options.tree) {
            return;
          }
          const name = `${dataSource.name}_${collection.options.name}_path`;

          //sync exisit tree collection path table
          this.syncExistTreeCollectionPathTable();

          //afterSync
          collectionManager.db.on(`${collection.name}.afterSync`, async (collection: Model) => {
            await this.defineTreePathCollection(name, collectionManager);
            await this.db
              .getCollection(name)
              .sync({ transaction: collection.transaction, force: false, alter: true } as SyncOptions);
          });

          //afterCreate
          this.db.on(`${collection.name}.afterCreate`, async (model: Model, options) => {
            const { transaction } = options;
            let path = `/${model.dataValues?.id}`;
            path = await this.getTreePath(model, path, collection.name);
            await this.app.db.getRepository(name).create({
              values: {
                nodePk: model.dataValues?.id,
                path: path,
                rootPk: path.split('/')[1],
              },
              transaction,
            });
          });

          //afterUpdate
          this.db.on(`${collection.name}.afterUpdate`, async (model, options) => {
            const { transaction } = options;
            let path = `/${model.dataValues?.id}`;
            path = await this.getTreePath(model, path, collection.name);
            const collectionTreePath = await this.app.db.getCollection(name);
            const nodePkColumnName = collectionTreePath.getField('nodePk').columnName();
            await this.app.db.getRepository(name).update({
              values: {
                path,
                rootPk: path.split('/')[1],
              },
              filter: {
                [nodePkColumnName]: model.dataValues?.id,
              },
              transaction,
            });
          });

          //afterDestroy
          this.db.on(`${collection.name}.afterDestroy`, async (model: Model, options: DestroyOptions) => {
            this.app.db.getRepository(name).destroy({
              filter: {
                nodePk: model.dataValues?.id,
              },
              ...options,
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
    for (const treeCollection of treeCollections) {
      const name = `main_${treeCollection.name}_path`;
      const treePathCollection = this.app.db.getCollection(name);
      if (!treePathCollection) {
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
      const treeExistsInDb = await this.app.db.getCollection(name).existsInDb();
      if (!treeExistsInDb) {
        await this.db.getCollection(name).sync({ force: false, alter: true });
        this.db.collection({
          name: treeCollection.name,
          autoGenId: false,
          timestamps: false,
          fields: [
            { type: 'integer', name: 'id' },
            { type: 'integer', name: 'parentId' },
          ],
        });
        const existDatas = await this.app.db.getRepository(treeCollection.name).find({});
        for (const data of existDatas) {
          let path = `/${data.dataValues?.id}`;
          path = await this.getTreePath(data, path, treeCollection.name);
          await this.app.db.getRepository(name).create({
            values: {
              nodePk: data.dataValues?.id,
              path: path,
              rootPk: path.split('/')[1],
            },
          });
        }
      }
    }
  }

  private async defineTreePathCollection(name: string, collectionManager: SequelizeCollectionManager) {
    collectionManager.db.collection({
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

  private async getTreePath(model, path, collectionName) {
    if (model.dataValues?.parentId !== null) {
      const parent = await this.app.db.getRepository(collectionName).findOne({
        filter: {
          id: model.dataValues?.parentId,
        },
      });
      if (parent) {
        path = `/${parent.dataValues?.id}${path}`;
        if (parent.dataValues?.parentId !== null) {
          path = await this.getTreePath(parent, path, collectionName);
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
