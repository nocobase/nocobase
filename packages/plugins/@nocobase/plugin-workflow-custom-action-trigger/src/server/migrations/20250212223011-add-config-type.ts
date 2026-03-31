/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { CONTEXT_TYPE } from '../../common/constants';

export default class extends Migration {
  appVersion = '<1.6.0-beta';
  async up() {
    const { db } = this.context;

    const WorkflowRepo = db.getRepository('workflows');
    await db.sequelize.transaction(async (transaction) => {
      const workflows = await WorkflowRepo.find({
        filter: {
          type: 'custom-action',
        },
        transaction,
      });

      await workflows.reduce(
        (promise, item) =>
          promise.then(() => {
            if (item.config.type != null) {
              // eslint-disable-next-line promise/no-return-wrap
              return Promise.resolve();
            }
            item.set('config', { ...item.config, type: CONTEXT_TYPE.SINGLE_RECORD });
            item.changed('config', true);
            return item.save({
              silent: true,
              transaction,
            });
          }),
        Promise.resolve(),
      );
    });
  }
}
