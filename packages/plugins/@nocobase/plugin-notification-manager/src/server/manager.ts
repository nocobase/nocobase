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
import { compile } from './utils/compile';

export class NotificationManager implements NotificationManager {
  private plugin: PluginNotificationManagerServer;
  public channelTypes = new Registry<{ Channel: NotificationChannelConstructor }>();

  constructor({ plugin }: { plugin: PluginNotificationManagerServer }) {
    this.plugin = plugin;
  }

  registerType({ type, Channel }: RegisterServerTypeFnParams) {
    this.channelTypes.register(type, { Channel });
  }

  createSendingRecord = async (options: WriteLogOptions) => {
    const logsRepo = this.plugin.app.db.getRepository(COLLECTION_NAME.logs);
    return logsRepo.create({ values: options });
  };

  async send(params: SendOptions) {
    this.plugin.logger.info('receive sending message request', params);
    const channelsRepo = this.plugin.app.db.getRepository(COLLECTION_NAME.channels);
    const message = compile(params.message ?? {}, params.data ?? {});
    const messageData = { ...(params.receivers ? { receivers: params.receivers } : {}), ...message };
    const logData: any = {
      triggerFrom: params.triggerFrom,
      channelName: params.channelName,
      message: messageData,
    };
    try {
      const channel = await channelsRepo.findOne({ filterByTk: params.channelName });
      if (channel) {
        const Channel = this.channelTypes.get(channel.notificationType).Channel;
        const instance = new Channel(this.plugin.app);
        logData.channelTitle = channel.title;
        logData.notificationType = channel.notificationType;
        logData.receivers = params.receivers;
        const result = await instance.send({ message, channel, receivers: params.receivers });
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
      this.plugin.logger.error(`notification send failed, options: ${JSON.stringify(error)}`);
      logData.reason = JSON.stringify(error);
      this.createSendingRecord(logData);
      return logData;
    }
  }
  async sendToUsers(options: SendUserOptions) {
    this.plugin.logger.info(`notificationManager.sendToUsers options: ${JSON.stringify(options)}`);
    const { userIds, channels, message, data = {} } = options;
    return await Promise.all(
      channels.map((channelName) =>
        this.send({
          channelName,
          message,
          data,
          triggerFrom: 'sendToUsers',
          receivers: { value: userIds, type: 'userId' },
        }),
      ),
    );
  }
}

export default NotificationManager;
