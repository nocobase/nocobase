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
  appVersion = '<1.0.0-alpha.7';
  on = 'afterSync';
  async up() {
    const { db } = this.context;

    const UiSchemaRepo = db.getRepository('uiSchemas');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await UiSchemaRepo.find({
        filter: {
          'schema.x-component': 'Action',
          'schema.x-designer': 'Action.Designer',
          'schema.x-action': 'customize:triggerWorkflows',
          $or: [
            {
              'schema.x-component-props.useProps': 'useTriggerWorkflowsActionProps',
            },
            {
              'schema.x-component-props.useProps': 'useRecordTriggerWorkflowsActionProps',
            },
            {
              'schema.x-use-component-props': 'useTriggerWorkflowsActionProps',
            },
            {
              'schema.x-use-component-props': 'useRecordTriggerWorkflowsActionProps',
            },
          ],
        },
        transaction,
      });

      for (const node of nodes) {
        const schema = node.get('schema');
        schema['x-action'] = 'customize:triggerWorkflows_deprecated';
        node.set('schema', { ...schema });
        node.changed('schema', true);
        await node.save({ transaction });
      }
    });
  }
}
