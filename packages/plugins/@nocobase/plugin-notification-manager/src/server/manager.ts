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
  NotificationQueueMessage,
  NotificationChannelConstructor,
  RegisterServerTypeFnParams,
  ReceiversOptions,
  SendOptions,
  SendUserOptions,
  WriteLogOptions,
} from './types';
import { compile } from './utils/compile';
import { Transactionable } from '@nocobase/database';

export class NotificationManager implements NotificationManager {
  private static readonly SLOW_SEND_THRESHOLD_MS = 500;
  private plugin: PluginNotificationManagerServer;
  public channelTypes = new Registry<{ Channel: NotificationChannelConstructor }>();

  constructor({ plugin }: { plugin: PluginNotificationManagerServer }) {
    this.plugin = plugin;
  }

  registerType({ type, Channel }: RegisterServerTypeFnParams) {
    this.channelTypes.register(type, { Channel });
  }

  createSendingRecord = async (options: WriteLogOptions & Transactionable) => {
    const logsRepo = this.plugin.app.db.getRepository(COLLECTION_NAME.logs);
    const { transaction, ...values } = options;
    return logsRepo.create({ values, transaction });
  };

  private toQueueMessage(params: SendOptions): NotificationQueueMessage {
    const { transaction, ...message } = params;
    return message;
  }

  private getQueuedResult(params: SendOptions) {
    return {
      status: 'success' as const,
      triggerFrom: params.triggerFrom,
      channelName: params.channelName,
      receivers: params.receivers,
      queued: true,
    };
  }

  private async enqueue(message: NotificationQueueMessage) {
    await this.plugin.app.eventQueue.publish(this.plugin.sendQueueChannel, message);
  }

  async findChannel(name: string) {
    return await this.plugin.getChannel(name);
  }

  private getReceiverMeta(receivers?: ReceiversOptions) {
    if (!receivers) {
      return {};
    }

    if (receivers.type === 'userId') {
      return {
        receiverType: receivers.type,
        receiverCount: receivers.value.length,
      };
    }

    return {
      receiverType: receivers.type,
    };
  }

  async send(params: SendOptions) {
    const queueMessage = this.toQueueMessage(params);
    const transaction = params.transaction;

    if (transaction?.afterCommit) {
      transaction.afterCommit(() => {
        void this.enqueue(queueMessage).catch((error) => {
          this.plugin.logger.error('notification queue publish failed after transaction committed', {
            channelName: params.channelName,
            triggerFrom: params.triggerFrom,
            reason: error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error),
          });
        });
      });
      return this.getQueuedResult(params);
    }

    try {
      await this.enqueue(queueMessage);
      return this.getQueuedResult(params);
    } catch (error) {
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error);
      this.plugin.logger.error('notification queue publish failed', {
        channelName: params.channelName,
        triggerFrom: params.triggerFrom,
        reason,
      });
      return {
        status: 'failure' as const,
        reason,
        triggerFrom: params.triggerFrom,
        channelName: params.channelName,
        receivers: params.receivers,
      };
    }
  }

  async sendNow(params: NotificationQueueMessage) {
    const startedAt = Date.now();
    const receiverMeta = this.getReceiverMeta(params.receivers);
    const compileStartedAt = Date.now();
    const message = compile(params.message ?? {}, params.data ?? {});
    const compileMs = Date.now() - compileStartedAt;
    const messageData = { ...(params.receivers ? { receivers: params.receivers } : {}), ...message };
    const logData: any = {
      triggerFrom: params.triggerFrom,
      channelName: params.channelName,
      message: messageData,
    };
    let findChannelMs = 0;
    let channelSendMs = 0;

    try {
      const findChannelStartedAt = Date.now();
      const channel = await this.findChannel(params.channelName);
      findChannelMs = Date.now() - findChannelStartedAt;
      if (channel) {
        const Channel = this.channelTypes.get(channel.notificationType).Channel;
        const instance = new Channel(this.plugin.app);
        logData.channelTitle = channel.title;
        logData.notificationType = channel.notificationType;
        logData.receivers = params.receivers;
        const channelSendStartedAt = Date.now();
        const result = await instance.send({
          message,
          channel,
          receivers: params.receivers,
        });
        channelSendMs = Date.now() - channelSendStartedAt;
        logData.status = result.status;
        logData.reason = result.reason;
      } else {
        logData.status = 'failure';
        logData.reason = 'channel not found';
      }
      await this.createSendingRecord(logData);
      const totalMs = Date.now() - startedAt;
      if (totalMs >= NotificationManager.SLOW_SEND_THRESHOLD_MS) {
        this.plugin.logger.warn('notification send is slow', {
          channelName: params.channelName,
          triggerFrom: params.triggerFrom,
          status: logData.status,
          notificationType: logData.notificationType,
          compileMs,
          findChannelMs,
          channelSendMs,
          totalMs,
          ...receiverMeta,
        });
      }
      return logData;
    } catch (error) {
      logData.status = 'failure';
      const totalMs = Date.now() - startedAt;
      const reason = error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error);
      this.plugin.logger.error('notification send failed', {
        channelName: params.channelName,
        triggerFrom: params.triggerFrom,
        compileMs,
        findChannelMs,
        channelSendMs,
        totalMs,
        reason,
        ...receiverMeta,
      });
      logData.reason = reason;
      await this.createSendingRecord(logData);
      return logData;
    }
  }
  async sendToUsers(options: SendUserOptions) {
    this.plugin.logger.debug('notificationManager.sendToUsers', {
      channelCount: options.channels.length,
      userCount: options.userIds.length,
    });
    const { userIds, channels, message, data = {} } = options;
    return await Promise.all(
      channels.map((channelName) =>
        this.send({
          channelName,
          message,
          data,
          triggerFrom: 'sendToUsers',
          receivers: { value: userIds, type: 'userId' },
          transaction: options.transaction,
        }),
      ),
    );
  }
}

export default NotificationManager;
