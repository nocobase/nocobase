/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.21.0-alpha.7';

  async up() {
    const Field = this.context.db.getRepository('fields');
    const field = await Field.findOne({
      filter: {
        name: 'phone',
        collectionName: 'users',
        interface: 'phone',
      },
    });
    if (!field) {
      return;
    }
    await field.update({
      interface: 'input',
      options: {
        ...field.options,
        uiSchema: {
          type: 'string',
          title: '{{t("Phone")}}',
          'x-component': 'Input',
          required: true,
        },
      },
    });
  }
}
