/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import PluginWorkflowServer, {
  EXECUTION_REASON,
  EXECUTION_STATUS,
  JOB_STATUS,
  WorkflowModel,
} from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';
import { vi } from 'vitest';

const nodemailerMock = vi.hoisted(() => {
  const transporter = {
    close: vi.fn(),
    sendMail: vi.fn(),
  };

  return {
    transporter,
    createTransport: vi.fn(() => transporter),
  };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: nodemailerMock.createTransport,
  },
}));

describe('workflow > instructions > mailer', () => {
  let app: MockServer;
  let db: Database;
  let workflow: WorkflowModel;
  let workflowPlugin: PluginWorkflowServer;

  beforeEach(async () => {
    nodemailerMock.transporter.close.mockClear();
    nodemailerMock.transporter.sendMail.mockImplementation(() => {});
    nodemailerMock.createTransport.mockClear();

    app = await getApp({
      plugins: ['workflow-mailer'],
    });
    db = app.db;
    workflowPlugin = app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    const WorkflowRepo = db.getCollection('workflows').repository;

    workflow = await WorkflowRepo.create({
      values: {
        enabled: true,
        type: 'asyncTrigger',
        options: {
          timeout: 300,
        },
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('workflow timeout should abort pending mailer send', async () => {
    await workflow.createNode({
      type: 'mailer',
      config: {
        provider: {
          host: 'smtp.example.com',
          port: 465,
          secure: true,
          auth: {
            user: 'user',
            pass: 'pass',
          },
        },
        from: 'from@example.com',
        to: ['to@example.com'],
        subject: 'subject',
        contentType: 'text',
        text: 'content',
      },
    });

    await workflowPlugin.execute(workflow, {}, { force: true });

    let [execution] = await workflow.getExecutions();
    for (let i = 0; i < 20 && execution?.status !== EXECUTION_STATUS.ABORTED; i++) {
      await sleep(100);
      [execution] = await workflow.getExecutions();
    }

    expect(nodemailerMock.transporter.sendMail).toHaveBeenCalledTimes(1);
    expect(nodemailerMock.transporter.close).toHaveBeenCalledTimes(1);
    expect(execution?.status).toBe(EXECUTION_STATUS.ABORTED);
    expect(execution?.reason).toBe(EXECUTION_REASON.TIMEOUT);
    if (!execution) {
      throw new Error('execution was not created');
    }

    let [job] = await execution.getJobs();
    for (let i = 0; i < 20 && job?.status !== JOB_STATUS.ABORTED; i++) {
      await sleep(100);
      [job] = await execution.getJobs();
    }
    if (!job) {
      throw new Error('job was not created');
    }
    expect(job.status).toBe(JOB_STATUS.ABORTED);
  });
});
