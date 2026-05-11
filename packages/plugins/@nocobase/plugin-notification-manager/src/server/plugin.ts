/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Cache } from '@nocobase/cache';
import type { Logger } from '@nocobase/logger';
import { Transactionable } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { COLLECTION_NAME } from '../constant';
import NotificationManager from './manager';
import { RegisterServerTypeFnParams, SendOptions, SendUserOptions } from './types';
export class PluginNotificationManagerServer extends Plugin {
  private static readonly CHANNELS_CACHE_KEY = 'channels';
  private manager: NotificationManager;
  logger: Logger;
  cache: Cache;

  get sendQueueChannel() {
    return `${this.name}.send`;
  }

  private async ensureCache() {
    if (!this.cache) {
      this.cache = await this.app.cacheManager.createCache({
        name: this.name,
        prefix: this.name,
      });
    }
    return this.cache;
  }

  parseChannel(instance) {
    return this.app.environment.renderJsonTemplate(instance.toJSON());
  }

  async loadChannels(options?: Transactionable) {
    const cache = await this.ensureCache();
    const repository = this.app.db.getRepository(COLLECTION_NAME.channels);
    const channels = await repository.find({
      transaction: options?.transaction,
    });
    const channelsCache = {};
    for (const channel of channels) {
      channelsCache[channel.get('name')] = this.parseChannel(channel);
    }
    await cache.set(PluginNotificationManagerServer.CHANNELS_CACHE_KEY, channelsCache);
  }

  async getChannel(name: string) {
    const cache = await this.ensureCache();
    const channels =
      (await cache.get<Record<string, any>>(PluginNotificationManagerServer.CHANNELS_CACHE_KEY)) || undefined;

    if (!channels) {
      await this.loadChannels();
      const reloadedChannels = await cache.get<Record<string, any>>(PluginNotificationManagerServer.CHANNELS_CACHE_KEY);
      return reloadedChannels?.[name] || null;
    }

    return channels[name] || null;
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

  async sendNow(options: SendOptions) {
    const { transaction, ...message } = options;
    return await this.manager.sendNow(message);
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
    this.app.on('afterStart', async () => {
      await this.loadChannels();
    });
  }

  async load() {
    const Channel = this.app.db.getModel(COLLECTION_NAME.channels);
    Channel.afterSave(async (_model, { transaction }) => {
      await this.loadChannels({ transaction });
    });
    Channel.afterDestroy(async (_model, { transaction }) => {
      await this.loadChannels({ transaction });
    });

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
