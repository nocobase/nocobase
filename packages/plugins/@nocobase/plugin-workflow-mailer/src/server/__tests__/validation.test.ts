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

describe('workflow > instructions > mailer > validation', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['workflow-mailer'],
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

  it('should accept when provider is not provided', async () => {
    const { status } = await agent.resource('workflows.nodes', workflow.id).create({
      values: { type: 'mailer', config: {} },
    });
    expect(status).toBe(200);
  });

  it('should accept when provider.host is missing', async () => {
    const { status } = await agent.resource('workflows.nodes', workflow.id).create({
      values: { type: 'mailer', config: { provider: {} } },
    });
    expect(status).toBe(200);
  });

  it('should accept with valid provider', async () => {
    const { status } = await agent.resource('workflows.nodes', workflow.id).create({
      values: { type: 'mailer', config: { provider: { host: 'smtp.example.com' } } },
    });
    expect(status).toBe(200);
  });
});
