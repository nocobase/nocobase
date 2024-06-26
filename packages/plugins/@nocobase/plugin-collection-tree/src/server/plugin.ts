/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Collection, CreateOptions } from '@nocobase/database';
import { CollectionModel } from '@nocobase/plugin-data-source-main/dist/server/models';
import { AdjacencyListRepository } from '@nocobase/database/lib/repositories/tree-repository/adjacency-list-repository';

class PluginCollectionTreeServer extends Plugin {
  async beforeLoad() {
    const condition = (options) => {
      return options.tree;
    };

    this.app.db.collectionFactory.registerCollectionType(TreeCollection, {
      condition,
    });

    this.db.on('collections.beforeCreate', async (collection: CollectionModel, options: CreateOptions | undefined) => {
      const dataSource = 'main';
      let pathCollectionName = `${collection.get('name')}`;
      if (!pathCollectionName.endsWith('_path')) {
        pathCollectionName = `${dataSource}_${collection.get('name')}_path`;
      }
      const { transaction } = options;
      if (!condition(collection.options)) {
        return;
      }

      this.app.db.getRepository('collections').create({
        values: {
          name: `${pathCollectionName}`,
          title: `${pathCollectionName}`,
          autoGenId: false,
          hidden: false,
          timestamps: false,
          dumpRules: 'required',
          origin: '@nocobase/database',
          fields: [
            {
              type: 'text',
              name: 'fullPath',
            },
          ],
        },
        transaction,
      });

      this.app.db.collection({
        name: pathCollectionName,
        autoGenId: false,
        timestamps: false,
        dumpRules: 'required',
        origin: '@nocobase/database',
        fields: [
          {
            type: 'text',
            name: 'fullPath',
          },
        ],
      });
      const collectionTree = this.app.db.getCollection(`${pathCollectionName}`);
      if (collectionTree) {
        // @ts-ignore
        collectionTree.model.refreshAttributes();

        // @ts-ignore
        collectionTree.model._findAutoIncrementAttribute();
        await collectionTree.model.sync();
      }

      // 关联字段
      options.fields.push({
        type: 'hasOne',
        name: 'path',
        foreignKey: 'nodePk',
        target: `${pathCollectionName}`,
      });
    });

    this.db.on('collections.afterDestroy', async (collection: CollectionModel, options) => {
      const dataSource = 'main';
      const pathCollectionName = `${dataSource}_${collection.get('name')}_path`;
      const { transaction } = options;
      if (!condition(collection.options)) {
        return;
      }

      // 删掉 path 表
      this.db.getRepository('collections').destroy({
        filter: {
          name: `${pathCollectionName}`,
        },
        transaction,
      });
    });
  }
}

class TreeCollection extends Collection {
  setRepository() {
    this.repository = new AdjacencyListRepository(this);
  }
}

export default PluginCollectionTreeServer;
