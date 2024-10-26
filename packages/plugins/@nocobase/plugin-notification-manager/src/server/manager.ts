/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { COLLECTION_NAME } from '../constant';
import PluginNotificationManagerServer from './plugin';
import type {
  NotificationChannelConstructor,
  RegisterServerTypeFnParams,
  SendOptions,
  SendUserOptions,
  WriteLogOptions,
} from './types';

export class NotificationManager implements NotificationManager {
  private plugin: PluginNotificationManagerServer;
  private notificationTypes = new Registry<{ Channel: NotificationChannelConstructor }>();

  constructor({ plugin }: { plugin: PluginNotificationManagerServer }) {
    this.plugin = plugin;
  }

  registerType({ type, Channel }: RegisterServerTypeFnParams) {
    this.notificationTypes.register(type, { Channel });
  }

  createSendingRecord = async (options: WriteLogOptions) => {
    const logsRepo = this.plugin.app.db.getRepository(COLLECTION_NAME.logs);
    return logsRepo.create({ values: options });
  };

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
        const Channel = this.notificationTypes.get(channel.notificationType).Channel;
        const instance = new Channel(this.plugin.app);
        logData.channelTitle = channel.title;
        logData.notificationType = channel.notificationType;
        const result = await instance.send({ message: params.message, channel, receivers: params.receivers });
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
  async sendToUsers(options: SendUserOptions) {
    const { userIds, channels, message, data } = options;
    return await Promise.all(
      channels.map((channelName) =>
        this.send({ channelName, message, triggerFrom: 'sendToUsers', receivers: { value: userIds, type: 'userId' } }),
      ),
    );
  }
}

export default NotificationManager;
