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
import { CONTEXT_TYPE } from '../../common/constants';

describe('workflow-custom-action-trigger > validation', () => {
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
    it('custom-action workflow with valid GLOBAL config should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.GLOBAL,
          },
        },
      });
      expect(status).toBe(200);
    });

    it('custom-action workflow with valid SINGLE_RECORD config should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'posts',
          },
        },
      });
      expect(status).toBe(200);
    });

    it('custom-action workflow with valid MULTIPLE_RECORDS config should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.MULTIPLE_RECORDS,
            collection: 'posts',
          },
        },
      });
      expect(status).toBe(200);
    });

    it('custom-action workflow without type should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {},
        },
      });
      expect(status).toBe(400);
    });

    it('custom-action workflow with invalid type value should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: 99,
          },
        },
      });
      expect(status).toBe(400);
    });

    it('SINGLE_RECORD without collection should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
          },
        },
      });
      expect(status).toBe(400);
    });

    it('MULTIPLE_RECORDS without collection should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.MULTIPLE_RECORDS,
          },
        },
      });
      expect(status).toBe(400);
    });

    it('GLOBAL without collection should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.GLOBAL,
          },
        },
      });
      expect(status).toBe(200);
    });

    it('SINGLE_RECORD with non-existent collection should return 400', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'non_existent_collection',
          },
        },
      });
      expect(status).toBe(400);
    });

    it('config with valid appends should create successfully', async () => {
      const { status } = await agent.resource('workflows').create({
        values: {
          enabled: true,
          type: 'custom-action',
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'posts',
            appends: ['tags'],
          },
        },
      });
      expect(status).toBe(200);
    });
  });

  describe('update', () => {
    it('update custom-action workflow with valid config should succeed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'posts',
            appends: ['tags'],
          },
        },
      });
      expect(status).toBe(200);
    });

    it('update custom-action workflow with invalid config should return 400', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
        },
      });

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: {
            type: CONTEXT_TYPE.SINGLE_RECORD,
            collection: 'non_existent_collection',
          },
        },
      });
      expect(status).toBe(400);
    });
  });
});
