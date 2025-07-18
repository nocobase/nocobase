/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, test } from 'vitest';

import { MockServer } from '@nocobase/test';
import { getApp } from '@nocobase/plugin-workflow-test';

import Migration from '../../migrations/20250619213102-add-missed-stats';
import PluginWorkflowServer from '../..';
import { EXECUTION_STATUS } from '../../constants';

describe('20250619213102-add-missed-stats', () => {
  let app: MockServer;
  let plugin: PluginWorkflowServer;
  let WorkflowRepo;
  let WorkflowStatsRepo;

  describe('missed stats should be added', () => {
    beforeEach(async () => {
      app = await getApp();
      await app.version.update('1.7.0');
      plugin = app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
      WorkflowRepo = app.db.getRepository('workflows');
      WorkflowStatsRepo = app.db.getRepository('workflowStats');
    });

    afterEach(() => app.destroy());

    test('current workflow stats missing', async () => {
      const workflow = await WorkflowRepo.create({
        values: {
          type: 'syncTrigger',
          key: 'abc',
          current: true,
        },
        hooks: false,
      });
      const e1 = await workflow.createExecution({
        key: workflow.get('key'),
        eventKey: '1',
        context: {},
        status: EXECUTION_STATUS.RESOLVED,
      });

      const s1 = await WorkflowStatsRepo.findOne({
        filterByTk: workflow.get('key'),
      });

      expect(s1).toBeNull();

      const migration = new Migration({ app, db: app.db } as any);
      await migration.up();

      const s2 = await WorkflowStatsRepo.findOne({
        filterByTk: workflow.get('key'),
      });

      expect(s2).not.toBeNull();
      expect(s2.get('executed')).toBe(1);
    });
  });
});
