/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sleep } from '@nocobase/test';
import { getCluster } from '@nocobase/plugin-workflow-test';

import Plugin, { Processor } from '..';
import { EXECUTION_STATUS } from '../constants';
import { MemoryEventQueueAdapter, QueueMessageOptions } from '@nocobase/server';

const memoryQueues: Map<string, { id: string; content: any; options?: QueueMessageOptions }[]> = new Map();

class MockMemoryEventQueueAdapter extends MemoryEventQueueAdapter {
  constructor(options) {
    super(options);
    // NOTE: singleton for crossing all nodes
    this.queues = memoryQueues;
  }
}

describe('workflow > cluster', () => {
  let cluster;

  beforeEach(async () => {
    cluster = await getCluster({
      number: 3,
    });
  });

  afterEach(async () => {
    await cluster.destroy();
  });

  describe('sync message', () => {
    it('enabled status of workflow should be sync in every nodes', async () => {
      const [app1, app2, app3] = cluster.nodes;

      const WorkflowRepo = app1.db.getRepository('workflows');

      const w1 = await WorkflowRepo.create({
        values: {
          type: 'syncTrigger',
          enabled: true,
        },
      });

      const p1 = app1.pm.get(Plugin) as Plugin;

      const pro1 = (await p1.trigger(w1, {})) as Processor;
      expect(pro1.execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      await sleep(550);

      const p2 = app2.pm.get(Plugin) as Plugin;
      const w2 = p2.enabledCache.get(w1.id);
      expect(w2).toBeDefined();
      const pro2 = (await p2.trigger(w2, {})) as Processor;
      expect(pro2.execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const p3 = app3.pm.get(Plugin) as Plugin;
      const w3 = p3.enabledCache.get(w1.id);
      expect(w3).toBeDefined();
      const pro3 = (await p3.trigger(w3, {})) as Processor;
      expect(pro3.execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const executions = await w1.getExecutions();
      expect(executions.length).toBe(3);

      await w1.update({
        enabled: false,
      });

      await sleep(550);

      expect(p2.enabledCache.get(w1.id)).toBeUndefined();
      expect(p3.enabledCache.get(w1.id)).toBeUndefined();
    });
  });

  describe('event queue', () => {
    beforeEach(async () => {
      for (const node of cluster.nodes) {
        await node.eventQueue.close();
        node.eventQueue.setAdapter(new MockMemoryEventQueueAdapter({ appName: node.name }));
        await node.eventQueue.connect();
      }
    });

    it('should be able to process executions on other nodes', async () => {
      const [app1, app2, app3] = cluster.nodes;

      const p1 = app1.pm.get(Plugin) as Plugin;
      const p2 = app2.pm.get(Plugin) as Plugin;

      const w1 = await app1.db.getRepository('workflows').create({
        values: {
          type: 'asyncTrigger',
          enabled: true,
        },
      });

      const n1 = await w1.createNode({
        type: 'timeConsume',
        config: {
          duration: 300,
        },
      });

      const n2 = await w1.createNode({
        type: 'recordAppName',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      p1.trigger(w1, { a: 1 });
      p1.trigger(w1, { a: 2 });
      p1.trigger(w1, { a: 3 });
      p1.trigger(w1, { a: 4 });

      await sleep(200);

      const e1s = await w1.getExecutions({ order: [['id', 'ASC']] });
      expect(e1s.length).toBe(4);
      expect(e1s[0].status).toBe(EXECUTION_STATUS.STARTED);
      expect(e1s[1].status).toBe(EXECUTION_STATUS.QUEUEING);
      expect(e1s[2].status).toBe(EXECUTION_STATUS.QUEUEING);
      expect(e1s[3].status).toBe(EXECUTION_STATUS.QUEUEING);

      await sleep(1500);

      const e2s = await w1.getExecutions({ order: [['id', 'ASC']], include: ['jobs'] });
      expect(e2s.length).toBe(4);
      expect(e2s[0].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2s[1].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2s[2].status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(e2s[3].status).toBe(EXECUTION_STATUS.RESOLVED);

      const appNameJobs = e2s.map((item) => item.jobs.find((job) => job.nodeId === n2.id));
      expect(appNameJobs[0].result).toBe(app1.name);
      expect(appNameJobs[1].result).toBe(app1.name);
      expect(appNameJobs[2].result).toBe(app2.name);
      expect(appNameJobs[3].result).toBe(app3.name);
    });
  });
});
