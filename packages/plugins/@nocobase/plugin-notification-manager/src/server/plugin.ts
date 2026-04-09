/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Logger } from '@nocobase/logger';
import { Plugin } from '@nocobase/server';
import NotificationManager from './manager';
import { RegisterServerTypeFnParams, SendOptions, SendUserOptions } from './types';
export class PluginNotificationManagerServer extends Plugin {
  private manager: NotificationManager;
  logger: Logger;

  get sendQueueChannel() {
    return `${this.name}.send`;
  }

  get channelTypes() {
    return this.manager.channelTypes;
  }

  registerChannelType(params: RegisterServerTypeFnParams) {
    this.manager.registerType(params);
  }
  async send(options: SendOptions) {
    return await this.manager.send(options);
  }

  async sendToUsers(options: SendUserOptions) {
    return await this.manager.sendToUsers(options);
  }

  async afterAdd() {
    this.logger = this.createLogger({
      dirname: 'notification-manager',
      filename: '%DATE%.log',
      transports: ['dailyRotateFile'],
    });
    this.manager = new NotificationManager({ plugin: this });
  }

  async beforeLoad() {
    this.app.resourceManager.registerActionHandler('messages:send', async (ctx, next) => {
      const sendOptions = ctx.action?.params?.values as SendOptions;
      await this.manager.send(sendOptions);
      await next();
    });
    this.app.acl.registerSnippet({
      name: 'pm.notification.channels',
      actions: ['notificationChannels:*'],
    });
    this.app.acl.registerSnippet({
      name: 'pm.notification.logs',
      actions: ['notificationSendLogs:*'],
    });
  }

  async load() {
    this.app.eventQueue.subscribe(this.sendQueueChannel, {
      concurrency: 1,
      idle: () => true,
      process: async (message) => {
        await this.manager.sendNow(message);
      },
    });
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {
    this.app.eventQueue.unsubscribe(this.sendQueueChannel);
  }

  async remove() {
    this.app.eventQueue.unsubscribe(this.sendQueueChannel);
  }
}

export default PluginNotificationManagerServer;
