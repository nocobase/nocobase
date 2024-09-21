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

  async send(params: SendOptions) {
    this.plugin.logger.info('receive sending message request', params);
    const channelsRepo = this.plugin.app.db.getRepository(COLLECTION_NAME.channels);
    const logData: any = {
      triggerFrom: params.triggerFrom,
      channelName: params.channelName,
      message: params.message,
    };
    try {
      const channel = await channelsRepo.findOne({ filterByTk: params.channelName });
      if (channel) {
        const notificationServer = this.notificationTypes.get(channel.notificationType).server;
        logData.channelTitle = channel.title;
        logData.notificationType = channel.notificationType;
        const result = await notificationServer.send({ message: params.message, channel });
        logData.status = result.status;
        logData.reason = result.reason;
      } else {
        logData.status = 'failure';
        logData.reason = 'channel not found';
      }
      this.createSendingRecord(logData);
      return logData;
    } catch (error) {
      logData.status = 'failure';
      logData.reason = error.reason;
      this.createSendingRecord(logData);
      return logData;
    }
  }
}
