/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';
import type { NotificationServer } from './types';
import { COLLECTION_NAME } from '../constant';
import { IMessage, IChannel } from './types';
interface NotificatonType {
  Server: new () => NotificationServer;
}

export class PluginNotificationManager extends Plugin {
  protected notificationTypes = new Registry<{ server: NotificationServer }>();
  registerTypes(type: string, config: NotificatonType) {
    const server = new config.Server();
    this.notificationTypes.register(type, { server });
  }
  async send(message: IMessage) {
    const channelsRepo = this.app.db.getRepository('channels');
    const channel: IChannel = await channelsRepo.findOne({ filterByTk: message.channelId });
    const notificationServer = this.notificationTypes.get(channel.notificationType).server;
    notificationServer.send({ message, channel });
  }

  async afterAdd() {}

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
      const notificationServer = this.notificationTypes.get(channel.notificationType).server;
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
