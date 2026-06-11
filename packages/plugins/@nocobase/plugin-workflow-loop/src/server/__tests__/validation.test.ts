/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, ExtendedAgent } from '@nocobase/test';
import { getApp } from '@nocobase/plugin-workflow-test';
import { WorkflowModel } from '@nocobase/plugin-workflow';
import { EXIT } from '../../constants';
import Plugin from '..';

describe('workflow > instruction > loop > validation', () => {
  let app: MockServer;
  let agent: ExtendedAgent;
  let validationWorkflow: WorkflowModel;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });

    const db = app.db;
    const WorkflowRepo = db.getCollection('workflows').repository;
    agent = (app as MockServer).agent();
    validationWorkflow = await WorkflowRepo.create({
      values: {
        enabled: true,
        sync: true,
        type: 'asyncTrigger',
      },
    });
  });

  afterEach(() => app.destroy());

  it('should reject when exit is invalid', async () => {
    const { status } = await agent.resource('workflows.nodes', validationWorkflow.id).create({
      values: { type: 'loop', config: { exit: 99 } },
    });
    expect(status).toBe(400);
  });

  it('should accept with valid exit value', async () => {
    const { status } = await agent.resource('workflows.nodes', validationWorkflow.id).create({
      values: { type: 'loop', config: { exit: EXIT.RETURN } },
    });
    expect(status).toBe(200);
  });

  it('should accept with empty config', async () => {
    const { status } = await agent.resource('workflows.nodes', validationWorkflow.id).create({
      values: { type: 'loop', config: {} },
    });
    expect(status).toBe(200);
  });
});
