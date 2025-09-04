/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, SyncOptions } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import lodash from 'lodash';
import { Transaction } from 'sequelize';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<=1.3.0-beta';

  async getTreeCollections({ transaction }) {
    const treeCollections = await this.app.db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        'options.tree': 'adjacencyList',
      },
      transaction,
    });
    return treeCollections;
  }

  async up() {
    await this.db.sequelize.transaction(async (transaction) => {
      const treeCollections = await this.getTreeCollections({ transaction });
      for (const treeCollection of treeCollections) {
        await treeCollection.load({ transaction });

        const name = `main_${treeCollection.name}_path`;
        const collectionOptions = {
          name,
          autoGenId: false,
          timestamps: false,
          fields: [
            { type: 'bigInt', name: 'nodePk' },
            { type: 'string', name: 'path', length: 1024 },
            { type: 'bigInt', name: 'rootPk' },
          ],
          indexes: [
            {
              fields: [{ name: 'path', length: 191 }],
            },
          ],
        };
        const collectionInstance = this.db.getCollection(treeCollection.name);
        const treeCollectionSchema = collectionInstance.collectionSchema();
        if (this.app.db.inDialect('postgres') && treeCollectionSchema != this.app.db.options.schema) {
          collectionOptions['schema'] = treeCollectionSchema;
        }
        this.app.db.collection(collectionOptions);

        const treeExistsInDb = await this.app.db.getCollection(name).existsInDb({ transaction });
        if (!treeExistsInDb) {
          await this.app.db.getCollection(name).sync({ transaction } as SyncOptions);
          const chunkSize = 1000;
          await this.app.db.getRepository(treeCollection.name).chunk({
            chunkSize: chunkSize,
            callback: async (rows, options) => {
              const pathData = [];
              for (const data of rows) {
                let path = `/${data.get('id')}`;
                path = await this.getTreePath(data, path, treeCollection, name, transaction);
                pathData.push({
                  nodePk: data.get('id'),
                  path: path,
                  rootPk: path.split('/')[1],
                });
              }
              await this.app.db.getModel(name).bulkCreate(pathData, { transaction });
            },
            transaction,
          });
        }
      }
    });
  }

  async getTreePath(
    model: Model,
    path: string,
    collection: Model,
    pathCollectionName: string,
    transaction: Transaction,
  ) {
    if (model.get('parentId') !== null) {
      const parent = await this.app.db.getRepository(collection.name).findOne({
        filter: {
          id: model.get('parentId') as any,
        },
        transaction,
      });
      if (parent && parent.get('parentId') !== model.get('id')) {
        path = `/${parent.get('id')}${path}`;
        const collectionTreePath = this.app.db.getCollection(pathCollectionName);
        const nodePkColumnName = collectionTreePath.getField('nodePk').columnName();
        const parentPathData = await this.app.db.getRepository(pathCollectionName).findOne({
          filter: {
            [nodePkColumnName]: parent.get('id'),
          },
          transaction,
        });
        const parentPath = lodash.get(parentPathData, 'path', null);
        if (parentPath == null) {
          path = await this.getTreePath(parent, path, collection, pathCollectionName, transaction);
        } else {
          path = `${parentPath}/${model.get('id')}`;
        }
      }
    }
    return path;
  }
}
