/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { createMockServer } from '@nocobase/test';
import channelCollection from '../../collections/channel';
import { COLLECTION_NAME } from '../../constant';
import NotificationManager from '../manager';

describe('notification manager server', () => {
  let app;
  let agent;
  let db;
  let notificationManager;

  const testChannelData = {
    name: `s_${uid()}`,
    notificationType: `test_${uid()}`,
    options: { test: uid() },
    title: 'test channel',
    description: 'test channel',
  };

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['notification-manager'] });
    agent = app.agent();
    db = app.db;

    db.collection(channelCollection);
    await db.sync();
    await app.load();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('create channel', async () => {
    class TestNotificationMailServer {
      async send({ message, channel }) {
        expect(channel.options.test).toEqual(1);
      }
    }
    notificationManager = new NotificationManager({
      plugin: {
        app,
        //@ts-ignore
        logger: {
          info: (log) => log,
        },
      },
    });

    notificationManager.registerType(testChannelData.notificationType, {
      Channel: TestNotificationMailServer,
    });

    const { body } = await agent.resource(COLLECTION_NAME.channels).create({
      values: {
        ...testChannelData,
      },
    });
    const channelsRepo = app.db.getRepository(COLLECTION_NAME.channels);
    const channel = await channelsRepo.findOne({ filterByTk: testChannelData.name });
    expect(body.data.title).toEqual(testChannelData.title);
    // const res = await notificationManager.send({
    //   channelName: testChannelData.name,
    //   message: { content: 'test message' },
    // });
    // console.log('aaaa', res);
  });
});
