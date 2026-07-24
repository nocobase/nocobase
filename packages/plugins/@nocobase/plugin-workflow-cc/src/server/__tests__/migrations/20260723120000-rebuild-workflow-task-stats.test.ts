/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import WorkflowPlugin from '@nocobase/plugin-workflow';
import { getApp } from '@nocobase/plugin-workflow-test';

import Plugin from '../../..';
import { TASK_TYPE_CC } from '../../../common/constants';
import Migration from '../../migrations/20260723120000-rebuild-workflow-task-stats';

describe('20260723120000-rebuild-workflow-task-stats', () => {
  it('rebuilds CC task stats from workflowCcTasks', async () => {
    const app = await getApp({
      plugins: ['users', 'auth', [Plugin, { packageName: '@nocobase/plugin-workflow-cc' }]],
    });

    try {
      const workflowPlugin = app.pm.get(WorkflowPlugin) as WorkflowPlugin;
      const user = await app.db.getRepository('users').findOne();
      const workflow = await app.db.getRepository('workflows').create({
        values: {
          type: 'syncTrigger',
          sync: true,
          enabled: true,
        },
      });
      await workflow.createNode({
        type: 'cc',
        config: {
          users: [user.id],
        },
      });
      await workflowPlugin.trigger(workflow, {});

      await app.db.getRepository('userWorkflowTaskStats').destroy({
        filter: { type: TASK_TYPE_CC },
      });
      await app.db.getRepository('userWorkflowTasks').destroy({
        filter: { type: TASK_TYPE_CC },
      });

      const migration = new Migration({ db: app.db, app } as never);
      await migration.up();

      const workflowStats = await app.db.getRepository('userWorkflowTaskStats').findOne({
        filter: {
          userId: user.id,
          workflowKey: workflow.key,
          type: TASK_TYPE_CC,
        },
      });
      expect(workflowStats?.get()).toMatchObject({
        pending: 1,
        all: 1,
      });

      const typeStats = await app.db.getRepository('userWorkflowTasks').findOne({
        filter: {
          userId: user.id,
          type: TASK_TYPE_CC,
        },
      });
      expect(typeStats?.get('stats')).toMatchObject({
        pending: 1,
        all: 1,
      });
    } finally {
      await app.destroy();
    }
  });
});
