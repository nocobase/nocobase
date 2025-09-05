/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Migration } from '@nocobase/server';
import { EXECUTION_STATUS } from '../constants';
import { Op } from 'sequelize';

export default class extends Migration {
  appVersion = '<1.9.0';
  async up() {
    const { db, app } = this.context;
    const ExecutionModel = db.getModel('executions');
    await ExecutionModel.update(
      { dispatched: true },
      {
        where: {
          status: [
            EXECUTION_STATUS.STARTED,
            EXECUTION_STATUS.RESOLVED,
            EXECUTION_STATUS.FAILED,
            EXECUTION_STATUS.ERROR,
            EXECUTION_STATUS.ABORTED,
            EXECUTION_STATUS.CANCELED,
            EXECUTION_STATUS.REJECTED,
            EXECUTION_STATUS.RETRY_NEEDED,
          ],
        },
      },
    );

    await ExecutionModel.update(
      {
        dispatched: false,
      },
      { where: { status: { [Op.is]: null } } },
    );
  }
}
