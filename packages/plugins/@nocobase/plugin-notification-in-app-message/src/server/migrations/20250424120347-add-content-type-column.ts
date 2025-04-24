/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { InAppMessagesDefinition } from '../../types';
export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.6.24';

  async up() {
    const { db } = this.context;

    const collection = db.getCollection(InAppMessagesDefinition.name);
    if (!collection) {
      return;
    }
    const Field = db.getRepository('fields');
    const existed = await Field.count({
      filter: {
        name: 'contentType',
        collectionName: InAppMessagesDefinition.name,
      },
    });
    if (existed) {
      return;
    }

    await db.getRepository('fields').create({
      values: {
        collectionName: InAppMessagesDefinition.name,
        name: 'contentType',
        type: 'string',
        interface: 'select',
        uiSchema: {
          type: 'string',
          title: '{{t("Content type")}}',
          'x-component': 'Select',
          'x-component-props': {
            options: [
              { label: '{{t("Text")}}', value: 'text' },
              { label: '{{t("HTML")}}', value: 'HTML' },
            ],
          },
        },
        options: {
          enum: ['HTML', 'text'],
        },
      },
    });

    // Update existing records to have contentType = 'text'
    // Update existing records to have 'map' as the default value
    await db.getRepository(InAppMessagesDefinition.name).update({
      filter: {
        contentType: null,
      },
      values: {
        contentType: 'text',
      },
    });
  }
}
