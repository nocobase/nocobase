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
import { CollectionRepository } from '@nocobase/plugin-data-source-main';
import { InheritedCollection } from '@nocobase/database';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.6.0';

  async up() {
    const queryInterface = this.db.sequelize.getQueryInterface();
    const CollectionRepo = this.db.getRepository('collections') as CollectionRepository;
    const FieldRepo = this.db.getRepository('fields');
    const StorageRepo = this.db.getRepository('storages');
    await CollectionRepo.load({
      filter: {
        'options.template': 'file',
      },
    });
    const collections = Array.from(this.db.collections.values()).filter(
      (item) => item.name === 'attachments' || item.options.template === 'file',
    );

    await this.db.sequelize.transaction(async (transaction) => {
      for (const collection of collections) {
        if (!(collection instanceof InheritedCollection)) {
          const tableName = collection.getTableNameWithSchema();
          await queryInterface.changeColumn(
            tableName,
            'url',
            {
              type: DataTypes.TEXT,
            },
            { transaction },
          );
          await queryInterface.changeColumn(
            tableName,
            'path',
            {
              type: DataTypes.TEXT,
            },
            { transaction },
          );
        }

        await FieldRepo.update({
          filter: {
            collectionName: collection.name,
            name: ['url', 'path', 'preview'],
          },
          values: {
            type: 'text',
            length: null,
          },
          transaction,
        });
      }

      await queryInterface.changeColumn(
        this.db.getCollection('storages').getTableNameWithSchema(),
        'path',
        {
          type: DataTypes.TEXT,
        },
        { transaction },
      );
      await FieldRepo.update({
        filter: {
          collectionName: 'storages',
          name: 'path',
        },
        values: {
          type: 'text',
        },
        transaction,
      });
    });
  }
}
