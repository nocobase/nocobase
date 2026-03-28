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

describe('workflow-variable > validation', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['error-handler', Plugin],
    });
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'asyncTrigger',
    });
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('variable node declaring new variable should create successfully', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: {
            target: null,
            value: 'test',
          },
        },
      });
      expect(status).toBe(200);
    });

    it('variable node with target should create successfully', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: {
            target: 'some-node-key',
            value: 123,
          },
        },
      });
      expect(status).toBe(200);
    });

    it('variable node with object value should create successfully', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: {
            target: null,
            value: { key: 'value' },
          },
        },
      });
      expect(status).toBe(200);
    });

    it('variable node with array value should create successfully', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: {
            target: null,
            value: [1, 2, 3],
          },
        },
      });
      expect(status).toBe(200);
    });

    it('variable node without config should skip validation', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
        },
      });
      expect(status).toBe(200);
    });

    it('variable node with empty config should create successfully', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: {},
        },
      });
      expect(status).toBe(200);
    });

    it('variable node with numeric value should create successfully', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: {
            value: -1,
          },
        },
      });
      expect(status).toBe(200);
    });

    it('variable node with boolean value should create successfully', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: {
            value: true,
          },
        },
      });
      expect(status).toBe(200);
    });
  });

  describe('update', () => {
    it('update variable node with valid config should succeed', async () => {
      const {
        body: { data: node },
      } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: { target: null, value: 'initial' },
        },
      });

      const { status } = await agent.resource('flow_nodes').update({
        filterByTk: node.id,
        values: {
          config: { target: null, value: 'updated' },
        },
      });
      expect(status).toBe(200);
    });

    it('update variable node to assign to target should succeed', async () => {
      const {
        body: { data: node },
      } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'variable',
          config: { target: null, value: 'initial' },
        },
      });

      const { status } = await agent.resource('flow_nodes').update({
        filterByTk: node.id,
        values: {
          config: { target: 'some-key', value: 'updated' },
        },
      });
      expect(status).toBe(200);
    });
  });
});
