import Database from '@nocobase/database';
import { Notification, NotificationService } from '../models';
import nodemailerMock from 'nodemailer-mock';
import { mockServer } from '@nocobase/test';
import _ from 'lodash';
import plugin from '../server';

jest.setTimeout(300000);

describe('notifications', () => {
  let db: Database;

  beforeEach(async () => {
    const app = mockServer();
    app.plugin(plugin);
    await app.load();
    db = app.db;
    await db.sync();
    NotificationService.createTransport = nodemailerMock.createTransport;
  });

  afterEach(() => db.close());

  it('create', async () => {
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
