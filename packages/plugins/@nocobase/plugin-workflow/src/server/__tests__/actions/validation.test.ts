/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp } from '@nocobase/plugin-workflow-test';
import { Instruction } from '../../instructions';
import type { FlowNodeModel } from '../../types';
import type Processor from '../../Processor';
import type { InstructionResult } from '../../instructions';
import WorkflowPlugin from '../..';

class SchemaInstruction extends Instruction {
  configSchema = Joi.object({
    name: Joi.string().required(),
    value: Joi.number().min(0),
  });

  run(node: FlowNodeModel, input: any, processor: Processor): InstructionResult {
    return { status: 1, result: node.config };
  }
}

class CustomValidateInstruction extends Instruction {
  configSchema = Joi.object({
    name: Joi.string().required(),
  });

  validateConfig(config: Record<string, any>): Record<string, string> | null {
    const errors = super.validateConfig(config);
    if (errors) {
      return errors;
    }
    if (config.name === 'forbidden') {
      return { name: '"name" cannot be "forbidden"' };
    }
    return null;
  }

  run(node: FlowNodeModel, input: any, processor: Processor): InstructionResult {
    return { status: 1, result: node.config };
  }
}

describe('workflow > actions > node validation', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['error-handler'],
    });
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;

    const workflowPlugin = app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('schemaTest', SchemaInstruction);
    workflowPlugin.registerInstruction('customValidateTest', CustomValidateInstruction);

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'asyncTrigger',
    });
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('without type should return 400', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {},
      });
      expect(status).toBe(400);
    });

    it('with unregistered type should return 400', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'nonexistent' },
      });
      expect(status).toBe(400);
    });

    it('node without configSchema should create successfully', async () => {
      const { status, body } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'echo', config: { anything: true } },
      });
      expect(status).toBe(200);
      expect(body.data.type).toBe('echo');
    });

    it('node without config should skip validation even with configSchema', async () => {
      const { status, body } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'schemaTest' },
      });
      expect(status).toBe(200);
      expect(body.data.type).toBe('schemaTest');
    });

    it('node with valid config should create successfully', async () => {
      const { status, body } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'schemaTest', config: { name: 'test', value: 1 } },
      });
      expect(status).toBe(200);
      expect(body.data.type).toBe('schemaTest');
    });

    it('node with invalid config (missing required field) should return 400', async () => {
      const { status, body } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'schemaTest', config: { value: 1 } },
      });
      expect(status).toBe(400);
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThan(0);
    });

    it('node with invalid config (value out of range) should return 400', async () => {
      const { status, body } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'schemaTest', config: { name: 'test', value: -1 } },
      });
      expect(status).toBe(400);
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThan(0);
    });

    it('node with extra unknown fields should pass (allowUnknown)', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'schemaTest', config: { name: 'test', extra: 'field' } },
      });
      expect(status).toBe(200);
    });

    it('custom validateConfig should reject forbidden value', async () => {
      const { status, body } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'customValidateTest', config: { name: 'forbidden' } },
      });
      expect(status).toBe(400);
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThan(0);
    });

    it('custom validateConfig should accept valid value', async () => {
      const { status } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'customValidateTest', config: { name: 'allowed' } },
      });
      expect(status).toBe(200);
    });

    it('custom validateConfig should still check schema first', async () => {
      const { status, body } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'customValidateTest', config: {} },
      });
      expect(status).toBe(400);
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('update with valid config should succeed', async () => {
      const {
        body: { data: node },
      } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'schemaTest', config: { name: 'original' } },
      });
      const { status } = await agent.resource('flow_nodes').update({
        filterByTk: node.id,
        values: { config: { name: 'updated' } },
      });
      expect(status).toBe(200);
    });

    it('update with invalid config should return 400', async () => {
      const {
        body: { data: node },
      } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'schemaTest', config: { name: 'original' } },
      });
      const { status, body } = await agent.resource('flow_nodes').update({
        filterByTk: node.id,
        values: { config: { value: -1 } },
      });
      expect(status).toBe(400);
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThan(0);
    });

    it('custom validateConfig should reject on update', async () => {
      const {
        body: { data: node },
      } = await agent.resource('workflows.nodes', workflow.id).create({
        values: { type: 'customValidateTest', config: { name: 'allowed' } },
      });
      const { status, body } = await agent.resource('flow_nodes').update({
        filterByTk: node.id,
        values: { config: { name: 'forbidden' } },
      });
      expect(status).toBe(400);
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThan(0);
    });
  });
});
