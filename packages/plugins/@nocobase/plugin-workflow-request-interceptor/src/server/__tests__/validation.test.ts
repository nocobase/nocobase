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
import { getApp } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

describe('workflow-request-interceptor > validation', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['error-handler', Plugin],
    });
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('request-interception workflow with valid config should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'posts',
          },
        },
      });
      expect(status).toBe(200);
    });

    it('request-interception workflow without collection should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {},
        },
      });
      expect(status).toBe(400);
    });

    it('request-interception workflow with non-existent collection should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'non_existent_collection',
          },
        },
      });
      expect(status).toBe(400);
    });

    it('request-interception workflow with global mode and valid actions should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'posts',
            global: true,
            actions: ['create', 'update'],
          },
        },
      });
      expect(status).toBe(200);
    });

    it('request-interception workflow with global mode but empty actions should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'posts',
            global: true,
            actions: [],
          },
        },
      });
      expect(status).toBe(400);
    });

    it('request-interception workflow with global mode but no actions should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'posts',
            global: true,
          },
        },
      });
      expect(status).toBe(400);
    });

    it('request-interception workflow with global mode and invalid action should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'posts',
            global: true,
            actions: ['invalidAction'],
          },
        },
      });
      expect(status).toBe(400);
    });

    it('request-interception workflow with local mode (global=false) without actions should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'posts',
            global: false,
          },
        },
      });
      expect(status).toBe(200);
    });

    it('request-interception workflow with all valid action types should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'request-interception',
          config: {
            collection: 'posts',
            global: true,
            actions: ['create', 'update', 'updateOrCreate', 'destroy'],
          },
        },
      });
      expect(status).toBe(200);
    });
  });

  describe('update', () => {
    it('update request-interception workflow with valid config should succeed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          collection: 'posts',
        },
      });

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: {
            collection: 'posts',
            global: true,
            actions: ['create'],
          },
        },
      });
      expect(status).toBe(200);
    });

    it('update request-interception workflow to global mode without actions should return 400', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          collection: 'posts',
        },
      });

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: {
            collection: 'posts',
            global: true,
            actions: [],
          },
        },
      });
      expect(status).toBe(400);
    });

    it('update request-interception workflow with non-existent collection should return 400', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'request-interception',
        config: {
          collection: 'posts',
        },
      });

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: {
            collection: 'non_existent_collection',
          },
        },
      });
      expect(status).toBe(400);
    });
  });
});
