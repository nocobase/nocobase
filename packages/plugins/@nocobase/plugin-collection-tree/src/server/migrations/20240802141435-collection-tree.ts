/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { FindOneOptions, Model } from '@nocobase/database';
import { Transaction } from 'sequelize';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<=1.3.0-alpha';

  async up() {
    const transaction = await this.db.sequelize.transaction();
    const treeCollections = await this.app.db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        'options.tree': 'adjacencyList',
      },
      transaction,
    });

    for (const treeCollection of treeCollections) {
      const name = `main_${treeCollection.name}_path`;
      this.app.db.collection({
        name,
        autoGenId: false,
        timestamps: false,
        fields: [
          { type: 'integer', name: 'nodePk' },
          { type: 'string', name: 'path', length: 1024 },
          { type: 'integer', name: 'rootPk' },
        ],
        indexes: [
          {
            fields: ['path'],
          },
        ],
      });
      const treeExistsInDb = await this.app.db.getCollection(name).existsInDb();
      if (!treeExistsInDb) {
        await this.app.db.getCollection(name).sync();
        this.app.db.collection({
          name: treeCollection.name,
          autoGenId: false,
          timestamps: false,
          fields: [
            { type: 'integer', name: 'id' },
            { type: 'integer', name: 'parentId' },
          ],
        });
        const chunkSize = 1000;
        await this.app.db.getRepository(treeCollection.name).chunk({
          chunkSize: chunkSize,
          callback: async (rows, options) => {
            const pathData = [];
            for (const data of rows) {
              let path = `/${data.get('id')}`;
              path = await this.getTreePath(data, path, treeCollection.name, transaction);
              pathData.push({
                nodePk: data.get('id'),
                path: path,
                rootPk: path.split('/')[1],
              });
            }
            await this.app.db.getModel(name).bulkCreate(pathData);
          },
          transaction,
        });
      }
    }
    await transaction.commit();
  }

  async getTreePath(model: Model, path: string, collectionName: string, transaction: Transaction) {
    if (model.get('parentId') !== null) {
      const parent = await this.app.db.getRepository(collectionName).findOne({
        filter: {
          id: model.get('parentId') as FindOneOptions,
        },
        transaction,
      });
      if (parent && parent.get('parentId') !== model.get('id')) {
        path = `/${parent.get('id')}${path}`;
        if (parent.get('parentId') !== null) {
          path = await this.getTreePath(parent, path, collectionName, transaction);
        }
      }
    }
    return path;
  }
}
