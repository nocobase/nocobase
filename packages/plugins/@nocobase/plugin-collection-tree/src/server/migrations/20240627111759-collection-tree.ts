/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { Model } from '@nocobase/database';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<=1.2.8-alpha';

  async up() {
    const treeCollections = await this.app.db.getRepository('collections').find({
      appends: ['fields'],
      filter: {
        'options.tree': 'adjacencyList',
      },
    });

    const getTreePath = async (model: Model, path: string) => {
      if (model.dataValues?.parentId !== null) {
        const parent = await model.constructor.findByPk(model.dataValues?.parentId);
        if (parent) {
          path = `/${parent.dataValues?.id}${path}`;
        }
        if (parent.dataValues?.parentId !== null) {
          path = await getTreePath(parent, path);
        }
      }
      return path;
    };

    for (const treeCollection of treeCollections) {
      const name = `main_${treeCollection.name}_path`;
      this.db.collection({
        name,
        autoGenId: false,
        timestamps: false,
        fields: [
          { type: 'integer', name: 'nodePk' },
          { type: 'jsonb', name: 'path' },
          { type: 'integer', name: 'rootPK' },
          { type: 'integer', name: 'depth' },
        ],
      });
      const treeExistsInDb = await this.app.db.getCollection(name).existsInDb();
      if (!treeExistsInDb) {
        await this.db.getCollection(name).sync();
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
          path = await getTreePath(data, path);
          await this.app.db.getRepository(name).create({
            values: {
              nodePk: data.dataValues?.id,
              path: path,
              rootPK: path.split('/')[1],
              depth: path.split('/').length - 1,
            },
          });
        }
      }
    }
  }
}
