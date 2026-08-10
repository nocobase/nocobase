/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';

describe('workflow > instructions > manual > parallel', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let UserRepo;
  let UserJobModel;
  let userAgents;
  let users;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['workflow-manual', 'workflow-parallel'],
    });
    db = app.db;
    PostRepo = db.getCollection('posts').repository;
    UserRepo = db.getRepository('users');
    UserJobModel = db.getModel('workflowManualTasks');

    users = await UserRepo.create({
      values: [
        { id: 2, nickname: 'a' },
        { id: 3, nickname: 'b' },
      ],
    });
    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));

    workflow = await db.getCollection('workflows').model.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.destroy());

  it('allows manual jobs in different branches to be submitted concurrently', async () => {
    const parallelNode = await workflow.createNode({
      type: 'parallel',
    });
    await workflow.createNode({
      type: 'manual',
      upstreamId: parallelNode.id,
      branchIndex: 0,
      config: {
        assignees: [users[0].id],
        forms: {
          f1: {
            actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
          },
        },
      },
    });
    await workflow.createNode({
      type: 'manual',
      upstreamId: parallelNode.id,
      branchIndex: 1,
      config: {
        assignees: [users[1].id],
        forms: {
          f1: {
            actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
          },
        },
      },
    });

    await PostRepo.create({ values: { title: 't1' } });
    await sleep(500);

    const [execution] = await workflow.getExecutions();
    expect(execution.status).toBe(EXECUTION_STATUS.STARTED);
    const tasks = await UserJobModel.findAll({ order: [['userId', 'ASC']] });
    expect(tasks).toHaveLength(2);
    expect(tasks[0].jobId).not.toBe(tasks[1].jobId);

    const responses = await Promise.all(
      tasks.map((task, index) =>
        userAgents[index].resource('workflowManualTasks').submit({
          filterByTk: task.id,
          values: {
            result: { f1: { index }, _: 'resolve' },
          },
        }),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual([202, 202]);

    await sleep(1000);
    await execution.reload();
    expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
    const manualJobs = (await execution.getJobs()).filter((job) => job.nodeId !== parallelNode.id);
    expect(manualJobs).toHaveLength(2);
    expect(manualJobs.every((job) => job.status === JOB_STATUS.RESOLVED)).toBe(true);
  });
});
