/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

import { COLLECTION_NAME } from '../constant';
import { SendOptions, IChannel } from './types';
import NotificationManager from './manager';
export class PluginNotificationManager extends Plugin {
  notificationManager: NotificationManager;

  async send(options: SendOptions) {
    const channelsRepo = this.app.db.getRepository('channels');
    const channel: IChannel = await channelsRepo.findOne({ filterByTk: options.channelId });
    const notificationServer = this.notificationManager.notificationTypes.get(channel.notificationType).server;
    await notificationServer.send({ message: options, channel });
    const logsRepo = this.app.db.getRepository('messageLogs');
    logsRepo.create({ values: { channelId: options.channelId, triggerFrom: options.triggerFrom, status: 'success' } });
  }

  async afterAdd() {
    this.notificationManager = new NotificationManager();
  }

  async beforeLoad() {
    this.app.resourceManager.registerActionHandler('messages:send', async (ctx, next) => {
      const id = ctx.action?.params?.values?.id;
      const messagesRepo = ctx.db.getRepository('messages');
      const channelsRepo = ctx.db.getRepository('channels');
      const messageLogsRepo = ctx.db.getRepository(COLLECTION_NAME.messageLogs);
      const message = await messagesRepo.findOne({ filterByTk: id });
      const channel = await channelsRepo.findOne({ filterByTk: message.channelId });
      await messageLogsRepo.create({
        values: {
          messageId: message.id,
        },
      });
      const notificationServer = this.notificationManager.notificationTypes.get(channel.notificationType).server;
      notificationServer.send({ message, channel });
      next();
    });
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationManager;
