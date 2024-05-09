/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Migration } from '@nocobase/server';
import UiSchemaRepository from '../repository';

export default class extends Migration {
  appVersion = '<0.9.4-alpha.1';

  async up() {
    const result = await this.app.version.satisfies('<0.9.3-alpha.2');

    if (!result) {
      return;
    }

    const r = this.db.getRepository<UiSchemaRepository>('uiSchemas');
    const items = await r.find({
      filter: {
        'schema.x-component': 'CollectionField',
      },
    });
    console.log(items?.length);
    await this.db.sequelize.transaction(async (transaction) => {
      for (const item of items) {
        const schema = item.schema;
        if (!schema['x-collection-field']) {
          continue;
        }
        if (schema['type'] === 'string') {
          continue;
        }
        const field = this.db.getFieldByPath(schema['x-collection-field']);
        if (!field) {
          continue;
        }
        console.log(schema['x-collection-field'], schema['type']);
        if (['hasOne', 'belongsTo'].includes(field.type)) {
          schema['type'] = 'string';
        } else if (['hasMany', 'belongsToMany'].includes(field.type)) {
          schema['type'] = 'string';
        } else {
          continue;
        }
        item.set('schema', schema);
        await item.save({ transaction });
      }
    });
  }
}
