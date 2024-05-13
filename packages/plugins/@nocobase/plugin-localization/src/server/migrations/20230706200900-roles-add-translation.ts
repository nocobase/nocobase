/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class AddTranslationToRoleTitleMigration extends Migration {
  appVersion = '<0.11.1-alpha.1';
  async up() {
    const repo = this.context.db.getRepository('fields');
    const field = await repo.findOne({
      where: {
        collectionName: 'roles',
        name: 'title',
      },
    });
    if (field) {
      await repo.update({
        filter: {
          key: field.key,
        },
        values: {
          options: {
            ...field.options,
            translation: true,
          },
        },
      });
    }
  }

  async down() {}
}
