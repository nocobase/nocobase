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
    const Field = this.context.db.getRepository('fields');
    const fields = await Field.find({
      filter: {
        interface: 'unixTimestamp',
        type: 'bigInt',
      },
    });

    for (const field of fields) {
      // Update field type to unixTimestamp
      const uiSchema = field.get('uiSchema');

      uiSchema['x-component-props'] = {
        picker: 'date',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        showTime: uiSchema['x-component-props']?.showTime || true,
        accuracy: uiSchema['x-component-props']?.accuracy || 'second',
      };

      field.set('type', 'unixTimestamp');
      field.set('uiSchema', uiSchema);
      await field.save();
    }
  }
}
