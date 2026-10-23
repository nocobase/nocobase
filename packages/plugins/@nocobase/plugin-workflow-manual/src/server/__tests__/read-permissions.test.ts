/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getApp } from '@nocobase/plugin-workflow-test';
import { uid } from '@nocobase/utils';

describe('workflowManualTasks read permissions', () => {
  let app: Awaited<ReturnType<typeof getApp>>;
  let ownerAgent: ReturnType<typeof app.agent>;
  let otherAgent: ReturnType<typeof app.agent>;
  let rootAgent: ReturnType<typeof app.agent>;
  let ownerTaskId: number | string;
  let otherUserId: number | string;

  beforeAll(async () => {
    app = await getApp({
      acl: true,
      database: { tablePrefix: `t${uid(5)}_` },
      plugins: ['workflow-manual'],
    });
    const users = app.db.getRepository('users');
    const owner = await users.create({ values: { nickname: 'owner', roles: ['member'] } });
    const other = await users.create({ values: { nickname: 'other', roles: ['member'] } });
    otherUserId = other.id;
    ownerAgent = await app.agent().login(owner, 'member');
    otherAgent = await app.agent().login(other, 'member');
    rootAgent = await app.agent().login(await users.findOne({ filter: { id: 1 } }), 'root');
    const workflow = await app.db.getRepository('workflows').create({
      values: { type: 'syncTrigger', enabled: false },
    });
    const node = await workflow.createNode({
      type: 'manual',
      config: { users: [owner.id], assignees: [owner.id] },
    });
    for (const [index, user] of [owner, other].entries()) {
      const execution = await app.db.getRepository('executions').create({
        values: {
          workflowId: workflow.id,
          status: 0,
          context: { privateMarker: index ? 'other-secret' : 'owner-secret' },
        },
      });
      const job = await app.db.getRepository('jobs').create({
        values: { id: 1001 + index, nodeId: node.id, executionId: execution.id, status: 0, result: { value: index } },
      });
      const task = await app.db.getRepository('workflowManualTasks').create({
        values: { userId: user.id, workflowId: workflow.id, nodeId: node.id, executionId: execution.id, jobId: job.id },
      });
      if (!index) ownerTaskId = task.id;
    }
  });

  afterAll(async () => {
    await app?.destroy();
  });

  it('denies generic list to members and preserves root access', async () => {
    const denied = await ownerAgent.resource('workflowManualTasks').list();
    expect(denied.status).toBe(403);
    const allowed = await rootAgent.resource('workflowManualTasks').list();
    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toHaveLength(2);
  });

  it('scopes listMine even with caller-supplied filters', async () => {
    const mine = await ownerAgent.resource('workflowManualTasks').listMine();
    expect(mine.status).toBe(200);
    expect(mine.body.data.map((task: { id: number | string }) => task.id)).toEqual([ownerTaskId]);
    const filtered = await ownerAgent.resource('workflowManualTasks').listMine({
      filter: { $or: [{ userId: otherUserId }, { id: ownerTaskId }], userId: otherUserId },
    });
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toEqual([]);
  });

  it('does not disclose another user task with or without an ID', async () => {
    const byId = await otherAgent.resource('workflowManualTasks').get({ filterByTk: ownerTaskId });
    expect(byId.status).toBe(200);
    expect(byId.body.data?.id).toBeUndefined();
    const byFilter = await otherAgent.resource('workflowManualTasks').get({ filter: { id: ownerTaskId } });
    expect(byFilter.status).toBe(200);
    expect(byFilter.body.data?.id).toBeUndefined();
    const first = await otherAgent.resource('workflowManualTasks').get();
    expect(first.status).toBe(200);
    expect(first.body.data.userId).toBe(otherUserId);
  });

  it('preserves detail associations while blocking traversal to other executions', async () => {
    const response = await ownerAgent.resource('workflowManualTasks').get({
      filterByTk: ownerTaskId,
      appends: [
        'node',
        'job',
        'user',
        'workflow',
        'workflow.nodes',
        'execution',
        'execution.jobs',
        'workflow.executions',
        'workflow.executions.context',
        'job.execution',
        'execution.workflow',
        'user.roles',
      ],
    });
    expect(response.status).toBe(200);
    expect(response.body.data.execution.context.privateMarker).toBe('owner-secret');
    expect(response.body.data.execution.jobs).toHaveLength(1);
    expect(response.body.data.workflow.nodes).toHaveLength(1);
    expect(response.body.data.workflow.executions).toBeUndefined();
    expect(response.body.data.job.execution).toBeUndefined();
    expect(response.body.data.execution.workflow).toBeUndefined();
    expect(response.body.data.user.roles).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('other-secret');
  });

  it('limits association expansion through listMine appends and fields', async () => {
    const response = await ownerAgent.resource('workflowManualTasks').listMine({
      appends: ['execution.status', 'execution.status', 'workflow.executions.context', 'execution.jobs.execution'],
      fields: ['id', 'execution.status', 'execution.status', 'workflow.executions.context'],
    });
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].execution.status).toBe(0);
    expect(JSON.stringify(response.body)).not.toContain('other-secret');
    expect(response.body.data[0].workflow?.executions).toBeUndefined();
  });

  it('does not turn rejected field selections into unrestricted reads', async () => {
    const response = await ownerAgent.resource('workflowManualTasks').get({
      filterByTk: ownerTaskId,
      fields: ['workflow.executions.context'],
    });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ id: ownerTaskId });
  });

  it('requires authentication for personal reads', async () => {
    for (const action of ['listMine', 'get']) {
      const response = await app.agent().resource('workflowManualTasks')[action]();
      expect([401, 403]).toContain(response.status);
    }
  });
});
