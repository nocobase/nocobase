/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class LoggingMigration extends Migration {
  appVersion = '<0.7.1-alpha.4';
  async up() {
    const result = await this.app.version.satisfies('<=0.7.0-alpha.83');
    if (!result) {
      return;
    }
    const repository = this.context.db.getRepository('collections');
    const collections = await repository.find();
    for (const collection of collections) {
      if (!collection.get('logging')) {
        collection.set('logging', true);
        await collection.save();
      }
    }
  }
}
