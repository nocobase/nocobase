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
  appVersion = '<0.14.0-alpha.4';

  async up() {
    if (!this.db.inDialect('postgres')) {
      return;
    }

    if (this.context.app.name !== 'main') {
      return;
    }

    // find collections that not set schema
    const userCollections = await this.db.getRepository('collections').find({
      filter: {
        'options.schema': null,
        'options.from.$ne': 'db2cm',
      },
    });

    for (const collection of userCollections) {
      await collection.set('schema', process.env.COLLECTION_MANAGER_SCHEMA || this.db.options.schema || 'public');
      await collection.save();
    }

    await this.context.app.emitAsync('loadCollections');
  }
}
