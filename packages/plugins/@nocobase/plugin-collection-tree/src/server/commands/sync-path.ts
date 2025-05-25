/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import { Database, Model, Transaction } from '@nocobase/database';
import lodash from 'lodash';

async function getTreePath(
  db: Database,
  model: Model,
  path: string,
  collection: string,
  pathCollectionName: string,
  transaction?: Transaction,
): Promise<string> {
  if (model.get('parentId') !== null) {
    const parent = await db.getRepository(collection).findOne({
      filter: { id: model.get('parentId') },
      transaction,
    });

    if (parent && parent.get('parentId') !== model.get('id')) {
      path = `/${parent.get('id')}${path}`;
      const collectionTreePath = db.getCollection(pathCollectionName);
      const nodePkColumnName = collectionTreePath.getField('nodePk').columnName();
      const parentPathData = await db.getRepository(pathCollectionName).findOne({
        filter: { [nodePkColumnName]: parent.get('id') },
        transaction,
      });
      const parentPath = lodash.get(parentPathData, 'path', null);
      if (parentPath == null) {
        path = await getTreePath(db, parent, path, collection, pathCollectionName, transaction);
      } else {
        path = `${parentPath}/${model.get('id')}`;
      }
    }
  }
  return path;
}

export default function (app: Application) {
  app
    .command('tree-collection:sync-path')
    .preload()
    .option('-c, --collection [collection]')
    .action(async (options) => {
      const { collection: name } = options || {};
      const mainData = app.pm.get('data-source-main') as any;
      mainData.setLoadFilter({
        name,
      });
      await app.emitAsync('beforeStart');
      if (!name) {
        throw new Error('Collection name is required');
      }

      const collection = app.db.getCollection(name);
      if (!collection) {
        throw new Error(`Collection ${name} not found`);
      }

      const isTree = collection.options.tree;
      if (!isTree) {
        throw new Error(`Collection ${name} is not a tree collection`);
      }

      const pathTableName = `main_${name}_path`;

      const pathRepo = app.db.getRepository(pathTableName);
      const nodeRepo = app.db.getRepository(name);

      const chunkSize = 1000;
      await app.db.sequelize.transaction(async (transaction) => {
        await pathRepo.destroy({ truncate: true, transaction });
        console.log(`Truncated table ${pathTableName}`);
        await nodeRepo.chunk({
          chunkSize,
          callback: async (records, options) => {
            const toInsert = [];
            for (const record of records) {
              const id = record.get('id');
              let path = `/${id}`;
              path = await getTreePath(app.db, record, path, name, pathTableName, transaction);
              toInsert.push({
                nodePk: id,
                path,
                rootPk: path.split('/')[1],
              });
            }
            if (toInsert.length > 0) {
              await app.db.getModel(pathTableName).bulkCreate(toInsert, { transaction });
              console.log(`Inserted ${toInsert.length} records into ${pathTableName}`);
            }
          },
          transaction,
        });
      });
    });
}
