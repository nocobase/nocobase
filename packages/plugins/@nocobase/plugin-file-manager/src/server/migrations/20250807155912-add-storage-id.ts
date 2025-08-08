/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { CollectionRepository } from '@nocobase/plugin-data-source-main';
import { InheritedCollection } from '@nocobase/database';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.9.0';

  async up() {
    const CollectionRepo = this.db.getRepository('collections') as CollectionRepository;
    const FieldRepo = this.db.getRepository('fields');
    await CollectionRepo.load({
      filter: {
        'options.template': 'file',
      },
    });
    const collections = Array.from(this.db.collections.values()).filter(
      (item) => item.name === 'attachments' || item.options.template === 'file',
    );

    await this.db.sequelize.transaction(async (transaction) => {
      const toAddFields = [];
      for (const collection of collections) {
        if (collection instanceof InheritedCollection) {
          continue;
        }
        const exist = await FieldRepo.findOne({
          filter: {
            collectionName: collection.name,
            name: 'storageId',
          },
          transaction,
        });
        if (!exist) {
          toAddFields.push({
            collectionName: collection.name,
            name: 'storageId',
            type: 'bigInt',
            required: true,
            visible: true,
            index: true,
          });
        }
      }
      if (toAddFields.length) {
        await FieldRepo.create({ values: toAddFields, transaction });
      }
    });
  }
}
