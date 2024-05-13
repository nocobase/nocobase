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
  appVersion = '<=0.7.0-alpha.83';

  async up() {
    const result = await this.app.version.satisfies('<=0.7.0-alpha.83');
    if (!result) {
      return;
    }
    const Field = this.context.db.getRepository('fields');
    const fields = await Field.find();
    for (const field of fields) {
      if (field.get('interface') === 'subTable') {
        field.set('interface', 'o2m');
        await field.save();
      }
    }
  }
}
