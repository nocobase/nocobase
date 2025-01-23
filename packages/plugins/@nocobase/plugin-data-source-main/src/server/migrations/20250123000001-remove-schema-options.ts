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

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const CollectionRepository = this.context.db.getRepository('collections');
    const collections = await CollectionRepository.find({
      filter: {
        'options.from': 'db2cm',
      },
    });

    for (const collection of collections) {
      collection.set('schema', undefined);
      await collection.save();
    }
  }
}
