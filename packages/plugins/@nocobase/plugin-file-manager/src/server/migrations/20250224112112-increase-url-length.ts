/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from 'sequelize';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.5.14';

  async up() {
    const queryInterface = this.db.sequelize.getQueryInterface();
    const CollectionRepo = this.db.getRepository('collections');
    const FieldRepo = this.db.getRepository('fields');
    await this.db.sequelize.transaction(async (transaction) => {
      const collections = await CollectionRepo.find({
        filter: {
          'options.template': 'file',
        },
        transaction,
      });
      collections.push({
        name: 'attachments',
      });
      for (const item of collections) {
        const collection = this.db.getCollection(item.name) || this.db.collection(item);
        const tableName = collection.getTableNameWithSchema();
        await queryInterface.changeColumn(
          tableName,
          'url',
          {
            type: DataTypes.STRING(1024),
          },
          { transaction },
        );
        await FieldRepo.update({
          filter: {
            collectionName: item.name,
            name: 'url',
          },
          values: {
            length: 1024,
          },
          transaction,
        });
      }
    });
  }
}
