/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import type { Logger } from '@nocobase/logger';
import { COLLECTION_NAME } from '../constant';
import { SendOptions, IChannel, WriteLogOptions } from './types';
import NotificationManager from './manager';
export class PluginNotificationManager extends Plugin {
  notificationManager: NotificationManager;
  logger: Logger;

  async send(options: SendOptions) {
    this.logger.info('receive sending message request', options);
    const channelsRepo = this.app.db.getRepository('channels');
    const channel: IChannel = await channelsRepo.findOne({ filterByTk: options.channelId });
    const notificationServer = this.notificationManager.notificationTypes.get(channel.notificationType).server;
    notificationServer.send({ message: options, channel, createSendingRecord: this.createSendingRecord });
  }

  createSendingRecord = async (options: WriteLogOptions) => {
    const logsRepo = this.app.db.getRepository('messageLogs');
    return logsRepo.create({ values: options });
  };

  async afterAdd() {
    this.notificationManager = new NotificationManager();
  }

  async beforeLoad() {
    this.app.resourceManager.registerActionHandler('messages:send', async (ctx, next) => {
      const sendOptions = ctx.action?.params?.values as SendOptions;
      this.send(sendOptions);
      next();
    });
    this.app.acl.registerSnippet({
      name: 'pm.notification',
      actions: ['messages:*'],
    });
  }

  async load() {
    this.logger = this.createLogger({
      dirname: 'notification-manager',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginNotificationManager;
