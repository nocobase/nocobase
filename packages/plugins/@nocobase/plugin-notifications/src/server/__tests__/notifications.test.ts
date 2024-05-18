/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { createMockServer } from '@nocobase/test';
import nodemailerMock from 'nodemailer-mock';
import os from 'os';
import { Notification, NotificationService } from '../models';

describe('notifications', () => {
  let db: Database;

  let app;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['notifications'],
    });
    db = app.db;
    NotificationService.createTransport = nodemailerMock.createTransport;
  });

  afterEach(() => app.destroy());

  it.skipIf(os.platform() === 'win32')('create', async () => {
    const Notification = db.getCollection('notifications');
    const notification = (await Notification.repository.create({
      values: {
        subject: 'Subject',
        body: 'hell world',
        receiver_options: {
          data: 'to@nocobase.com',
          fromTable: 'users',
          filter: {},
          dataField: 'email',
        },
        service: {
          type: 'email',
          title: '阿里云邮件推送',
          options: {
            host: 'smtpdm.aliyun.com',
            port: 465,
            secure: true,
            auth: {
              user: 'from@nocobase.com',
              pass: 'pass',
            },
            from: 'NocoBase<from@nocobase.com>',
          },
        },
      },
    })) as Notification;
    await notification.send();
  });
});
