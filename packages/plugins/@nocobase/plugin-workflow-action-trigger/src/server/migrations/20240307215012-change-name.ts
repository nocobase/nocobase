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
  appVersion = '<0.20.0-alpha.7';
  on = 'afterSync';
  async up() {
    const { db } = this.context;

    const WorkflowRepo = db.getRepository('workflows');
    await db.sequelize.transaction(async (transaction) => {
      await WorkflowRepo.update({
        filter: {
          type: 'form',
        },
        values: {
          type: 'action',
        },
        transaction,
      });
    });
  }
}
