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
  appVersion = '<0.17.0-alpha.5';
  async up() {
    const result = await this.app.version.satisfies('<0.17.0-alpha.5');

    if (!result) {
      return;
    }

    const repository = this.db.getRepository('themeConfig');
    if (!repository) {
      return;
    }

    await repository.collection.sync();

    const systemSettings = await this.db.getRepository('systemSettings').findOne();
    const defaultThemeId = systemSettings.options?.themeId;
    if (!defaultThemeId) {
      return;
    }

    await this.db.sequelize.transaction(async (t) => {
      await repository.update({
        values: {
          default: false,
        },
        filter: {
          default: true,
        },
        transaction: t,
      });
      await repository.update({
        values: {
          default: true,
          optional: true,
        },
        filterByTk: defaultThemeId,
        transaction: t,
      });
    });
  }

  async down() {}
}
