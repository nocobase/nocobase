/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';

import PluginWorkflow, { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import Plugin from '..';
import { TASK_STATUS, TASK_TYPE_CC } from '../../common/constants';

describe('workflow > instructions > cc', () => {
  let app: MockServer;
  let db: Database;
  let WorkflowModel;
  let workflow;
  let workflowPlugin: PluginWorkflow;
  let ccPlugin: Plugin;
  let root;
  let rootAgent;
  let users;
  let userAgents;
  let AssignmentModel;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', [Plugin, { packageName: '@nocobase/plugin-workflow-cc' }]],
    });

    db = app.db;

    workflowPlugin = app.pm.get(PluginWorkflow);
    ccPlugin = app.pm.get(Plugin);

    WorkflowModel = db.getCollection('workflows').model;
    AssignmentModel = db.getCollection('workflowCcTasks').model;

    const UserRepo = db.getRepository('users');

    root = await UserRepo.findOne({});

    users = await UserRepo.createMany({
      records: [
        { id: 2, nickname: 'a', email: 'a@test.com', password: 'password' },
        { id: 3, nickname: 'b', email: 'b@test.com', password: 'password' },
        { id: 4, nickname: 'c', email: 'c@test.com', password: 'password' },
      ],
    });

    rootAgent = await app.agent().login(root);
    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'syncTrigger',
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('recipients', () => {
    it('should do nothing when no recipients configured', async () => {
      await workflow.createNode({
        type: 'cc',
        config: {
          title: 'test title',
        },
      });

      await workflowPlugin.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe(EXECUTION_STATUS.RESOLVED);

      const assignmentCount = await AssignmentModel.count();
      expect(assignmentCount).toBe(0);
    });

    it('task should be created to static user', async () => {
      await workflow.createNode({
        type: 'cc',
        config: {
          title: 'test title',
          users: [users[0].id, users[1].id],
        },
      });

      await workflowPlugin.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);

      const assignments = await AssignmentModel.findAll();
      expect(assignments.length).toBe(2);
      expect(assignments.map((item) => item.userId).sort()).toEqual([users[0].id, users[1].id].sort());
      assignments.forEach((item) => {
        expect(item.status).toBe(TASK_STATUS.UNREAD);
      });
    });

    it('task should be created to user by variable', async () => {
      await workflow.createNode({
        type: 'cc',
        config: {
          title: 'test title',
          users: ['{{$context.data.userId}}'],
        },
      });

      await workflowPlugin.trigger(workflow, {
        data: {
          userId: users[0].id,
        },
      });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);

      const assignments = await AssignmentModel.findAll();
      expect(assignments.length).toBe(1);
      expect(assignments[0].userId).toBe(users[0].id);
      expect(assignments[0].status).toBe(TASK_STATUS.UNREAD);
    });

    it('task should be created to user by query', async () => {
      await workflow.createNode({
        type: 'cc',
        config: {
          title: 'test title',
          users: [
            {
              filter: {
                id: ['{{$context.data.userId}}'],
              },
            },
          ],
        },
      });

      await workflowPlugin.trigger(workflow, {
        data: {
          userId: users[0].id,
        },
      });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);

      const assignments = await AssignmentModel.findAll();
      expect(assignments.length).toBe(1);
      expect(assignments[0].userId).toBe(users[0].id);
      expect(assignments[0].status).toBe(TASK_STATUS.UNREAD);
    });
  });

  describe('task title', () => {
    it('should use node title as task title', async () => {
      await workflow.createNode({
        type: 'cc',
        config: {
          title: 'test title for {{$context.a}}',
          users: [users[0].id, users[1].id],
        },
      });
      await workflowPlugin.trigger(workflow, { a: 123 });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toBe(1);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);

      const assignments = await AssignmentModel.findAll();
      expect(assignments.length).toBe(2);
      expect(assignments.map((item) => item.title)).toEqual(['test title for 123', 'test title for 123']);
    });
  });

  describe('actions', () => {
    let UserTasksRepo;
    beforeEach(async () => {
      UserTasksRepo = db.getRepository('userWorkflowTasks');
      await workflow.createNode({
        type: 'cc',
        config: {
          users: [users[0].id, users[1].id],
        },
      });

      await workflowPlugin.trigger(workflow, {});
    });

    it('should read a task', async () => {
      const uts1 = await UserTasksRepo.find({ sort: 'userId' });
      expect(uts1.length).toBe(2);
      expect(uts1[0].type).toBe(TASK_TYPE_CC);
      expect(uts1[1].type).toBe(TASK_TYPE_CC);
      expect(uts1[0].stats).toEqual({ pending: 1, all: 1 });
      expect(uts1[1].stats).toEqual({ pending: 1, all: 1 });

      const [assignment] = await AssignmentModel.findAll({ order: [['userId', 'ASC']] });
      expect(assignment.status).toBe(TASK_STATUS.UNREAD);

      const res1 = await userAgents[0].resource('workflowCcTasks').read({
        filterByTk: assignment.id,
      });
      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(1);
      expect(res1.body.data[0].status).toBe(TASK_STATUS.READ);

      const uts2 = await UserTasksRepo.find({ sort: 'userId' });
      expect(uts2.length).toBe(2);
      expect(uts2[0].type).toBe(TASK_TYPE_CC);
      expect(uts2[1].type).toBe(TASK_TYPE_CC);
      expect(uts2[0].stats).toEqual({ pending: 0, all: 1 });
      expect(uts2[1].stats).toEqual({ pending: 1, all: 1 });

      await assignment.reload();
      expect(assignment.status).toBe(TASK_STATUS.READ);

      const res2 = await userAgents[0].resource('workflowCcTasks').read({
        filterByTk: assignment.id,
      });
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(0);
    });

    it('should unread a task', async () => {
      const [assignment] = await AssignmentModel.findAll({ order: [['userId', 'ASC']] });
      expect(assignment.status).toBe(TASK_STATUS.UNREAD);

      const res1 = await userAgents[0].resource('workflowCcTasks').unread({
        filterByTk: assignment.id,
      });
      expect(res1.status).toBe(200);
      await assignment.reload();
      expect(assignment.status).toBe(TASK_STATUS.UNREAD);

      await assignment.update({ status: TASK_STATUS.READ });

      const res2 = await userAgents[0].resource('workflowCcTasks').unread({
        filterByTk: assignment.id,
      });
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(1);
      expect(res2.body.data[0].status).toBe(TASK_STATUS.UNREAD);

      await assignment.reload();
      expect(assignment.status).toBe(TASK_STATUS.UNREAD);
    });

    it('should read all tasks', async () => {
      const res = await userAgents[0].resource('workflowCcTasks').read();
      expect(res.status).toBe(200);

      const [a1, a2] = await AssignmentModel.findAll({ order: [['userId', 'ASC']] });
      expect(a1.status).toBe(TASK_STATUS.READ);
      expect(a2.status).toBe(TASK_STATUS.UNREAD);
    });

    it('should not access others task', async () => {
      const [assignment] = await AssignmentModel.findAll({ order: [['userId', 'ASC']] });

      const res = await userAgents[2].resource('workflowCcTasks').read({
        filterByTk: assignment.id,
      });
      expect(res.status).toBe(403);
    });
  });
});
