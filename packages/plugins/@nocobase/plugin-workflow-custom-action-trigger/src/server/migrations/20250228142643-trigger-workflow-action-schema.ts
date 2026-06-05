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
  appVersion = '<1.6.0';
  async up() {
    const { db } = this.context;
    const UISchemaRepo = db.getRepository('uiSchemas');
    await db.sequelize.transaction(async (transaction) => {
      const customButtons = await UISchemaRepo.find({
        filter: {
          'schema.x-designer': 'Action.Designer',
          'schema.x-action': 'customize:triggerWorkflows',
        },
        transaction,
      });
      console.log('%d nodes need to be migrated.', customButtons.length);

      await customButtons.reduce(
        (promise, node) =>
          promise.then(() => {
            const { schema } = node;
            delete schema['x-desiger'];
            schema['x-settings'] = 'actionSettings:submitToWorkflow';
            schema['x-toolbar-props'] = {
              initializer: false,
              showBorder: false,
            };
            node.set('schema', schema);
            node.changed('schema', true);
            return node.save({
              silent: true,
              transaction,
            });
          }),
        Promise.resolve(),
      );
    });
  }
}
