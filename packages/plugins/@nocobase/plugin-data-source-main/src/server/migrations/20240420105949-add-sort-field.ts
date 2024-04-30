/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { CollectionRepository } from '../repositories';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.21.0-alpha.13';

  async up() {
    const repository = this.db.getRepository<CollectionRepository>('collections');
    await repository.load();
    const collections = await this.db.getRepository('collections').find();
    const fields = [];
    for (const item of collections) {
      const collection = this.db.getCollection(item.name);
      collection.forEachField((field) => {
        if (field.type === 'sort') {
          fields.push({
            collectionName: item.name,
            name: field.name,
          });
        }
      });
    }
    const fieldRepository = this.db.getRepository('fields');
    for (const field of fields) {
      this.app.log.info(`field path: ${field.collectionName}.${field.name}`);
      const instance = await fieldRepository.findOne({
        filter: field,
      });
      if (instance?.interface) {
        continue;
      }
      await fieldRepository.updateOrCreate({
        values: {
          ...field,
          interface: 'sort',
          type: 'sort',
          hidden: false,
          uiSchema: {
            type: 'number',
            title: field.name,
            'x-component': 'InputNumber',
            'x-component-props': { stringMode: true, step: '1' },
            'x-validator': 'integer',
          },
          scopeKey: instance?.scopeKey,
        },
        filterKeys: ['collectionName', 'name'],
      });
    }
  }
}
