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

describe('workflow > cluster', () => {
  let cluster;

  beforeEach(async () => {
    cluster = await getCluster({
      number: 3,
    });
  });

  afterEach(() => cluster.destroy());

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
});
