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
import { vi } from 'vitest';
import channelCollection from '../../collections/channel';
import { COLLECTION_NAME } from '../../constant';
import NotificationManager from '../manager';
import PluginNotificationManagerServer from '../plugin';

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
        getChannel: vi.fn(),
        //@ts-ignore
        logger: {
          info: (log) => log,
        },
      },
    });

    notificationManager.registerType({
      type: testChannelData.notificationType,
      Channel: TestNotificationMailServer,
    });

    const { body } = await agent.resource(COLLECTION_NAME.channels).create({
      values: {
        ...testChannelData,
      },
    });
    expect(body.data.title).toEqual(testChannelData.title);
    // const res = await notificationManager.send({
    //   channelName: testChannelData.name,
    //   message: { content: 'test message' },
    // });
    // console.log('aaaa', res);
  });

  test('send should publish queue message immediately without transaction', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);

    notificationManager = new NotificationManager({
      plugin: {
        sendQueueChannel: 'notification-manager.send',
        getChannel: vi.fn(),
        app: {
          eventQueue: {
            publish,
          },
        },
        logger: {
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
    });

    const result = await notificationManager.send({
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
    });

    expect(publish).toHaveBeenCalledWith('notification-manager.send', {
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
    });
    expect(result).toEqual(
      expect.objectContaining({
        status: 'success',
        queued: true,
        channelName: testChannelData.name,
      }),
    );
  });

  test('send should defer queue publish until after transaction committed', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    let afterCommitCallback;
    const transaction = {
      afterCommit: vi.fn((callback) => {
        afterCommitCallback = callback;
      }),
    };

    notificationManager = new NotificationManager({
      plugin: {
        sendQueueChannel: 'notification-manager.send',
        getChannel: vi.fn(),
        app: {
          eventQueue: {
            publish,
          },
        },
        logger: {
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
    });

    const result = await notificationManager.send({
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
      transaction: transaction as any,
    });

    expect(transaction.afterCommit).toHaveBeenCalledTimes(1);
    expect(publish).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        status: 'success',
        queued: true,
      }),
    );

    afterCommitCallback();
    await Promise.resolve();

    expect(publish).toHaveBeenCalledWith('notification-manager.send', {
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
    });
  });

  test('send should only enqueue message and should not perform actual sending', async () => {
    const publish = vi.fn().mockResolvedValue(undefined);
    const getChannel = vi.fn().mockResolvedValue({
      name: testChannelData.name,
      title: testChannelData.title,
      notificationType: testChannelData.notificationType,
      options: {},
    });
    const create = vi.fn().mockResolvedValue(undefined);
    const send = vi.fn().mockResolvedValue({ status: 'success', message: { content: 'test' } });

    notificationManager = new NotificationManager({
      plugin: {
        sendQueueChannel: 'notification-manager.send',
        getChannel,
        app: {
          eventQueue: {
            publish,
          },
          db: {
            getRepository: vi.fn((name) => {
              if (name === COLLECTION_NAME.logs) {
                return { create };
              }
            }),
          },
          environment: {
            renderJsonTemplate: (value) => value,
          },
        },
        logger: {
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
    });

    notificationManager.registerType({
      type: testChannelData.notificationType,
      Channel: class {
        async send(args) {
          return await send(args);
        }
      } as any,
    });

    await notificationManager.send({
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
    });

    expect(publish).toHaveBeenCalledWith('notification-manager.send', {
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
    });
    expect(getChannel).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  test('sendNow should perform actual sending without transaction', async () => {
    const getChannel = vi.fn().mockResolvedValue({
      name: testChannelData.name,
      title: testChannelData.title,
      notificationType: testChannelData.notificationType,
      options: {},
    });
    const create = vi.fn().mockResolvedValue(undefined);
    const send = vi.fn().mockResolvedValue({ status: 'success', message: { content: 'test' } });

    notificationManager = new NotificationManager({
      plugin: {
        getChannel,
        app: {
          db: {
            getRepository: vi.fn((name) => {
              if (name === COLLECTION_NAME.logs) {
                return { create };
              }
            }),
          },
          environment: {
            renderJsonTemplate: (value) => value,
          },
        },
        logger: {
          debug: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
    });

    notificationManager.registerType({
      type: testChannelData.notificationType,
      Channel: class {
        async send(args) {
          return await send(args);
        }
      } as any,
    });

    await notificationManager.sendNow({
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
    });

    expect(getChannel).toHaveBeenCalledWith(testChannelData.name);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: expect.objectContaining({
          name: testChannelData.name,
        }),
        message: { content: 'test' },
        receivers: undefined,
      }),
    );
    expect(send.mock.calls[0][0]).not.toHaveProperty('transaction');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({
          status: 'success',
          channelName: testChannelData.name,
        }),
      }),
    );
  });

  test('plugin sendNow should bypass queue and perform actual sending', async () => {
    const plugin = app.pm.get('notification-manager') as PluginNotificationManagerServer;
    const sendNow = vi.spyOn((plugin as any).manager, 'sendNow').mockResolvedValue({
      status: 'success',
      triggerFrom: 'workflow',
      channelName: testChannelData.name,
    });

    const result = await plugin.sendNow({
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
      transaction: {
        afterCommit: vi.fn(),
      } as any,
    });

    expect(sendNow).toHaveBeenCalledWith({
      channelName: testChannelData.name,
      message: { content: 'test' },
      triggerFrom: 'workflow',
    });
    expect(result).toEqual(
      expect.objectContaining({
        status: 'success',
        channelName: testChannelData.name,
      }),
    );
  });

  test('plugin should reuse channels cache after initial load', async () => {
    const plugin = app.pm.get('notification-manager') as PluginNotificationManagerServer;
    const repository = app.db.getRepository(COLLECTION_NAME.channels);
    const find = vi.spyOn(repository, 'find');

    await agent.resource(COLLECTION_NAME.channels).create({
      values: {
        ...testChannelData,
      },
    });
    find.mockClear();

    await plugin.loadChannels();
    expect(find).toHaveBeenCalledTimes(1);

    const first = await plugin.getChannel(testChannelData.name);
    const second = await plugin.getChannel(testChannelData.name);

    expect(first?.name).toBe(testChannelData.name);
    expect(second?.name).toBe(testChannelData.name);
    expect(find).toHaveBeenCalledTimes(1);
  });

  test('plugin should lazy load channels cache when not initialized', async () => {
    const plugin = app.pm.get('notification-manager') as PluginNotificationManagerServer;
    const repository = app.db.getRepository(COLLECTION_NAME.channels);
    const find = vi.spyOn(repository, 'find');

    await agent.resource(COLLECTION_NAME.channels).create({
      values: {
        ...testChannelData,
      },
    });
    find.mockClear();

    await plugin.cache.del('channels');

    const channel = await plugin.getChannel(testChannelData.name);

    expect(channel?.name).toBe(testChannelData.name);
    expect(find).toHaveBeenCalledTimes(1);
  });
});
