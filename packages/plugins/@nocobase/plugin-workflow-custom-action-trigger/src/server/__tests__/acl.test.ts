/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';

import Plugin from '..';
import { CONTEXT_TYPE } from '../../common/constants';

describe('workflow: custom action trigger > ACL', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let root;
  let rootAgent;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      acl: true,
      plugins: ['system-settings', 'users', 'auth', 'acl', 'data-source-manager', 'error-handler', Plugin],
    });

    db = app.db;
    PostRepo = db.getCollection('posts').repository;
    WorkflowModel = db.getModel('workflows');

    const UserRepo = db.getCollection('users').repository;
    root = await UserRepo.findOne();
    rootAgent = await app.agent().login(root);
    users = await UserRepo.createMany({
      records: [
        { id: 2, nickname: 'a' },
        { id: 3, nickname: 'b' },
      ],
    });

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(() => app.destroy());

  describe('collection action', () => {
    it('should deny trigger when member role has no trigger permission configured', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const res = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });

      expect(res.status).toBe(403);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });

    it('should allow trigger when member role has trigger permission configured', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      // Grant trigger permission for member role on posts resource
      await rootAgent.resource('roles.resources', 'member').create({
        values: {
          name: 'posts',
          usingActionsConfig: true,
          actions: [{ name: 'trigger' }, { name: 'triggerNew' }],
        },
      });

      const res = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });

      expect(res.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('should deny trigger after revoking previously granted trigger permission', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      // Grant trigger permission
      const grantRes = await rootAgent.resource('roles.resources', 'member').create({
        values: {
          name: 'posts',
          usingActionsConfig: true,
          actions: [{ name: 'trigger' }, { name: 'triggerNew' }],
        },
      });

      const res1 = await userAgents[0].resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });
      expect(res1.status).toBe(200);

      // Revoke trigger permission (update to no actions)
      await rootAgent.resource('roles.resources', 'member').update({
        filterByTk: grantRes.body.data.id,
        values: {
          name: 'posts',
          usingActionsConfig: true,
          actions: [],
        },
      });

      const res2 = await userAgents[0].resource('posts').trigger({
        values: { title: 't2' },
        triggerWorkflows: workflow.key,
      });
      expect(res2.status).toBe(403);
    });
  });

  describe('global trigger on workflows resource', () => {
    it('should allow global trigger by default when no explicit workflows trigger permission is configured', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.GLOBAL,
        },
      });

      const res = await userAgents[0].resource('workflows').trigger({
        triggerWorkflows: workflow.key,
        values: { a: 1 },
      });

      expect(res.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('should allow global trigger when member role has trigger permission on workflows', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.GLOBAL,
        },
      });

      // Grant trigger permission for member role on workflows resource
      await rootAgent.resource('roles.resources', 'member').create({
        values: {
          name: 'workflows',
          usingActionsConfig: true,
          actions: [{ name: 'trigger' }],
        },
      });

      const res = await userAgents[0].resource('workflows').trigger({
        triggerWorkflows: workflow.key,
        values: { a: 1 },
      });

      expect(res.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('data scope enforcement', () => {
    it('should allow trigger on own record when "own data" scope is configured', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      // Get the "own" scope ID
      const ownScope = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
        filter: { key: 'own' },
      });

      // Grant trigger permission with "own data" scope
      await rootAgent.resource('roles.resources', 'member').create({
        values: {
          name: 'posts',
          usingActionsConfig: true,
          actions: [{ name: 'trigger', scope: ownScope.id }],
        },
      });

      // Create a post owned by users[0]
      const post = await PostRepo.create({
        values: { title: 't1' },
        context: { state: { currentUser: users[0] } },
      });

      // users[0] triggers on their own post → should succeed
      const res = await userAgents[0].resource('posts').trigger({
        filterByTk: post.id,
        triggerWorkflows: workflow.key,
      });

      expect(res.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
    });

    it('should deny trigger on another user record when "own data" scope is configured', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      // Get the "own" scope ID
      const ownScope = await db.getRepository('dataSourcesRolesResourcesScopes').findOne({
        filter: { key: 'own' },
      });

      // Grant trigger permission with "own data" scope
      await rootAgent.resource('roles.resources', 'member').create({
        values: {
          name: 'posts',
          usingActionsConfig: true,
          actions: [{ name: 'trigger', scope: ownScope.id }],
        },
      });

      // Create a post owned by users[0]
      const post = await PostRepo.create({
        values: { title: 't1' },
        context: { state: { currentUser: users[0] } },
      });

      // users[1] tries to trigger on users[0]'s post → should be denied
      const res = await userAgents[1].resource('posts').trigger({
        filterByTk: post.id,
        triggerWorkflows: workflow.key,
      });

      expect(res.status).toBe(403);

      const executions = await workflow.getExecutions();
      expect(executions.length).toBe(0);
    });
  });

  describe('root user', () => {
    it('should always allow root to trigger regardless of ACL configuration', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        sync: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const res = await rootAgent.resource('posts').trigger({
        values: { title: 't1' },
        triggerWorkflows: workflow.key,
      });

      expect(res.status).toBe(200);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });
});
