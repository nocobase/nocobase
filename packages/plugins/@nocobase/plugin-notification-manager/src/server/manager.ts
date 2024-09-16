/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import PluginNotificationManagerServer from './plugin';
import type { NotificationServerBase } from './types';
import { SendOptions, WriteLogOptions } from './types';
import { COLLECTION_NAME } from '../constant';
interface NotificatonType {
  server: NotificationServerBase;
}

export default class NotificationManager {
  plugin: PluginNotificationManagerServer;
  notificationTypes = new Registry<{ server: NotificationServerBase }>();

  constructor({ plugin }: { plugin: PluginNotificationManagerServer }) {
    this.plugin = plugin;
  }

  registerTypes(type: string, config: NotificatonType) {
    const server = config.server;
    config.server.setPluginCtx({ pluginCtx: this.plugin });
    this.notificationTypes.register(type, { server });
  }
  createSendingRecord = async (options: WriteLogOptions) => {
    const logsRepo = this.plugin.app.db.getRepository(COLLECTION_NAME.logs);
    return logsRepo.create({ values: options });
  };

  async parseReceivers(receiverType, receiversConfig, processor, node) {
    const configAssignees = processor
      .getParsedValue(node.config.assignees ?? [], node.id)
      .flat()
      .filter(Boolean);
    const assignees = new Set();
    const UserRepo = processor.options.plugin.app.db.getRepository('users');
    for (const item of configAssignees) {
      if (typeof item === 'object') {
        const result = await UserRepo.find({
          ...item,
          fields: ['id'],
          transaction: processor.transaction,
        });
        result.forEach((item) => assignees.add(item.id));
      } else {
        assignees.add(item);
      }
    }

    return [...assignees];
  }

  async send(options: SendOptions) {
    this.plugin.logger.info('receive sending message request', options);
    const channelsRepo = this.plugin.app.db.getRepository(COLLECTION_NAME.channels);
    const channel = await channelsRepo.findOne({ filterByTk: options.channelId });
    const notificationServer = this.notificationTypes.get(channel.notificationType).server;
    const result = await notificationServer.send({ message: options, channel });

    this.createSendingRecord({
      receiver: result.receivers.join(','),
      status: result.status,
      content: result.content,
      triggerFrom: options.triggerFrom,
      channelId: options.channelId,
      reason: result.reason,
      channelTitle: channel.title,
    });
    return result;
  }
}
