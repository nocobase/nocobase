/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import type { MockServer } from '@nocobase/test';
import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type { Transporter } from 'nodemailer';

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

describe('workflow > instructions > mailer', () => {
  let app: MockServer;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let sentMessages: Mail.Options[];

  beforeEach(async () => {
    sentMessages = [];

    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: vi.fn((message: Mail.Options, callback: (error: Error | null, result?: unknown) => void) => {
        sentMessages.push(message);
        callback(null, { accepted: message.to });
      }),
      close: vi.fn(),
    } as unknown as Transporter);

    app = await getApp({
      plugins: ['workflow-mailer'],
    });

    WorkflowModel = app.db.getCollection('workflows').model;
    PostRepo = app.db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.destroy();
  });

  it('sends selected file records as email attachments', async () => {
    const fileManager = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;
    const filePath = path.resolve(__dirname, './files/text1.txt');
    const file = await fileManager.createFileRecord({
      collectionName: 'attachments',
      filePath,
    });

    await workflow.createNode({
      type: 'mailer',
      config: {
        provider: {
          host: 'smtp.test',
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
        contentType: 'html',
        html: '<p>Hi</p>',
        attachments: [file.dataValues],
      },
    });

    await PostRepo.create({ values: { title: 't1' } });
    await sleep(500);

    const [execution] = await workflow.getExecutions();
    expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);

    const [job] = await execution.getJobs();
    expect(job.status).toBe(JOB_STATUS.RESOLVED);
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].attachments).toHaveLength(1);
    expect(sentMessages[0].attachments[0]).toMatchObject({
      filename: 'text1.txt',
    });

    const sentContent = await streamToBuffer(sentMessages[0].attachments[0].content as Readable);
    const expectedContent = await fs.readFile(filePath);
    expect(sentContent).toEqual(expectedContent);
  });
});
