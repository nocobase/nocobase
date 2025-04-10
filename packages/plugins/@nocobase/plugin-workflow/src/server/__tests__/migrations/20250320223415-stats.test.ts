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

import Migration from '../../migrations/20250320223415-stats';
import PluginWorkflowServer from '../..';

describe('20250320223415-stats', () => {
  let app: MockServer;
  let workflow;
  let plugin: PluginWorkflowServer;
  let WorkflowRepo;
  let WorkflowStatsRepo;
  let WorkflowVersionStatsRepo;

  describe('legacy stats should be migrated', () => {
    beforeEach(async () => {
      app = await getApp();
      await app.version.update('1.6.0');
      plugin = app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
      WorkflowRepo = app.db.getRepository('workflows');
      WorkflowStatsRepo = app.db.getRepository('workflowStats');
      WorkflowVersionStatsRepo = app.db.getRepository('workflowVersionStats');
    });

    afterEach(() => app.destroy());

    test('only one version', async () => {
      workflow = await WorkflowRepo.create({
        values: {
          type: 'syncTrigger',
          executed: 1,
          allExecuted: 1,
          key: 'abc',
        },
        hooks: false,
      });

      const migration = new Migration({ app, db: app.db } as any);
      await migration.up();

      const stats = await WorkflowStatsRepo.findOne({
        filterByTk: workflow.get('key'),
      });

      expect(stats.get('executed')).toBe(1);

      const versionStats = await WorkflowVersionStatsRepo.findOne({
        filterByTk: workflow.get('id'),
      });

      expect(versionStats.get('executed')).toBe(1);
    });

    test('multiple versions', async () => {
      const w1 = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'syncTrigger',
          executed: 1,
          allExecuted: 2,
          key: 'abc',
        },
        hooks: false,
      });

      const w2 = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'syncTrigger',
          executed: 1,
          allExecuted: 2,
          key: 'abc',
        },
        hooks: false,
      });

      const migration = new Migration({ app, db: app.db } as any);
      await migration.up();

      const stats = await WorkflowStatsRepo.findOne({
        filterByTk: w1.get('key'),
      });

      expect(stats.get('executed')).toBe(2);

      const v1Stats = await WorkflowVersionStatsRepo.findOne({
        filterByTk: w1.get('id'),
      });

      expect(v1Stats.get('executed')).toBe(1);

      const v2Stats = await WorkflowVersionStatsRepo.findOne({
        filterByTk: w2.get('id'),
      });

      expect(v2Stats.get('executed')).toBe(1);
    });
  });

  describe('executed field should works correctly after migrated', () => {
    beforeEach(async () => {
      app = await getApp();
      app.version.update('1.6.0');
      plugin = app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
      WorkflowStatsRepo = app.db.getRepository('workflowStats');
      WorkflowVersionStatsRepo = app.db.getRepository('workflowVersionStats');
      const WorkflowRepo = app.db.getRepository('workflows');
      workflow = await WorkflowRepo.create({
        values: {
          type: 'syncTrigger',
          key: 'abc',
        },
        hooks: false,
      });
    });

    afterEach(() => app.destroy());

    test('trigger should get correct executed value', async () => {
      const migration = new Migration({ app, db: app.db } as any);
      await migration.up();

      await workflow.update({
        enabled: true,
      });
      workflow.stats = await workflow.getStats();
      workflow.versionStats = await workflow.getVersionStats();

      await plugin.trigger(workflow, {});

      const stats = await WorkflowStatsRepo.findOne({
        filterByTk: workflow.get('key'),
      });

      expect(stats.get('executed')).toBe(1);

      const versionStats = await WorkflowVersionStatsRepo.findOne({
        filterByTk: workflow.get('id'),
      });

      expect(versionStats.get('executed')).toBe(1);
    });
  });
});
