/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import WorkflowPlugin from '../..';

describe('workflow > instructions > output', () => {
  let app: Application;
  let db: Database;
  let plugin: WorkflowPlugin;
  let PostRepo;
  let workflow;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();
    plugin = app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    db = app.db;
    PostRepo = db.getCollection('posts').repository;

    WorkflowModel = db.getCollection('workflows').model;
    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'syncTrigger',
    });
  });

  afterEach(() => app.destroy());

  describe('output', () => {
    it('output should change execution.output', async () => {
      const w1 = await WorkflowModel.create({
        type: 'syncTrigger',
        enabled: true,
      });

      const n1 = await w1.createNode({
        type: 'output',
        config: {
          value: 1,
        },
      });

      await plugin.trigger(w1, {});

      const [e1] = await w1.getExecutions();
      expect(e1.output).toBe(1);
      const e1Jobs = await e1.getJobs();
      expect(e1Jobs.length).toBe(1);
    });

    it('output could use variables', async () => {
      const w1 = await WorkflowModel.create({
        type: 'syncTrigger',
        enabled: true,
      });

      const n1 = await w1.createNode({
        type: 'output',
        config: {
          value: '{{$context.a}}',
        },
      });

      await plugin.trigger(w1, { a: 1 });

      const [e1] = await w1.getExecutions();
      expect(e1.output).toBe(1);
      const e1Jobs = await e1.getJobs();
      expect(e1Jobs.length).toBe(1);
    });

    it('last output node prevails', async () => {
      const w1 = await WorkflowModel.create({
        type: 'syncTrigger',
        enabled: true,
      });

      const n1 = await w1.createNode({
        type: 'output',
        config: {
          value: 1,
        },
      });

      const n2 = await w1.createNode({
        type: 'output',
        config: {
          value: 2,
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2.id);

      await plugin.trigger(w1, {});

      const [e1] = await w1.getExecutions();
      expect(e1.output).toBe(2);
      const e1Jobs = await e1.getJobs();
      expect(e1Jobs.length).toBe(2);
    });
  });
});
