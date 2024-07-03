/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Collection, Model, SyncOptions, AdjacencyListRepository } from '@nocobase/database';
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
      if (dataSource instanceof SequelizeDataSource) {
        const collectionManager = dataSource.collectionManager as SequelizeCollectionManager;
        collectionManager.db.on('afterDefineCollection', (collection: Model) => {
          if (!collection.options.tree) {
            return;
          }
          const name = `${dataSource.name}_${collection.options.name}_path`;
          this.db.collection({
            name,
            autoGenId: false,
            timestamps: false,
            fields: [
              { type: 'integer', name: 'nodePk' },
              { type: 'jsonb', name: 'path' },
              { type: 'integer', name: 'rootPK' },
            ],
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
                rootPK: path.split('/')[1],
              },
              transaction,
            });
          });

          //afterUpdate
          this.db.on(`${collection.name}.afterUpdate`, async (model, options) => {
            const { transaction } = options;
            let path = `/${model.dataValues?.id}`;
            path = await getTreePath(model, path, collection.name);
            await this.app.db.getRepository(name).update({
              values: {
                path,
                rootPK: path.split('/')[1],
              },
              filter: {
                nodePk: model.dataValues?.id,
              },
              transaction,
            });
          });

          //afterDestroy
          this.db.on(`${collection.name}.afterDestroy`, async (model: Model, options) => {
            const { transaction } = options;
            this.app.db.getRepository(name).destroy({
              filter: {
                nodePk: model.dataValues?.id,
              },
              // transaction,
            });
          });
        });
      }
    });

    this.db.on('afterSync', async (options) => {
      if (!condition(options)) {
        return;
      }

      const name = `main_${options.tableName}_path`;
      const treeCollectionName = options.modelName;
      if (this.db.getCollection(name)) {
        const treeExistsInDb = await this.app.db.getCollection(name).existsInDb();
        const treeCollectionInDb = await this.app.db.getCollection(treeCollectionName).existsInDb();
        if (!treeExistsInDb) {
          await this.db.getCollection(name).sync();
          if (treeCollectionInDb) {
            const existDatas = await this.app.db.getRepository(treeCollectionName).find({});
            for (const data of existDatas) {
              let path = `/${data.dataValues?.id}`;
              path = await this.getTreePath(data, path, treeCollectionName);
              this.app.db.getRepository(name).create({
                values: {
                  nodePk: data.dataValues?.id,
                  path: path,
                  rootPK: path.split('/')[1],
                },
              });
            }
          }
        }
      }
    });

    this.db.on('collections.afterDestroy', async (collection: Model, { transaction }) => {
      const name = `main_${collection.get('name')}_path`;
      if (!condition(collection.options)) {
        return;
      }

      await this.db.getCollection(name).removeFromDb({ transaction });
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
