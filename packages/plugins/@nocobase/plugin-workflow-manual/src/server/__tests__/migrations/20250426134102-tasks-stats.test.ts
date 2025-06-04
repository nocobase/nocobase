/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, test } from 'vitest';
import { getApp } from '@nocobase/plugin-workflow-test';

import Migration from '../../migrations/20250426134102-tasks-stats';

describe('20250426134102-tasks-stats', () => {
  test(`stats of tasks should be create for each user`, async () => {
    const app = await getApp({
      plugins: ['users', 'auth', 'workflow-manual'],
    });
    await app.version.update('1.6.0');
    const workflowPlugin: any = app.pm.get('workflow');

    const w1: any = await app.db.getRepository('workflows').create({
      values: {
        type: 'collection',
        sync: true,
        enabled: true,
      },
    });
    const n1 = await w1.createNode({
      type: 'manual',
      config: {
        assignees: [1],
      },
    });
    await workflowPlugin.trigger(w1, {});

    const ManualTaskRepo = app.db.getRepository('workflowManualTasks');
    const t1 = await ManualTaskRepo.findOne({
      filter: {
        userId: 1,
        workflowId: w1.id,
        nodeId: n1.id,
      },
    });

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    const UserTasksStatsRepo = app.db.getRepository('userWorkflowTasks');
    const stats = await UserTasksStatsRepo.find();

    expect(stats.length).toBe(1);
    expect(stats[0].get()).toMatchObject({
      userId: 1,
      type: 'manual',
      stats: { pending: 1, all: 1 },
    });

    await app.destroy();
  });
});
