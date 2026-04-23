/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<2.1.0-alpha.21';

  async up() {
    const { db } = this.context;
    const WorkflowModel = db.getModel('workflows');

    await db.sequelize.transaction(async (transaction) => {
      await WorkflowModel.update(
        {
          createdById: 1,
        },
        {
          where: {
            createdById: {
              [Op.is]: null,
            },
          },
          silent: true,
          transaction,
        },
      );

      await WorkflowModel.update(
        {
          updatedById: 1,
        },
        {
          where: {
            updatedById: {
              [Op.is]: null,
            },
          },
          silent: true,
          transaction,
        },
      );
    });
  }
}
