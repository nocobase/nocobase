/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createConsoleLogger, Logger } from '@nocobase/logger';
import Application from '@nocobase/server';
import { SYSTEM_MANAGEMENT_SUB_APP_START_EVENT } from '../constants';
import { getQueueName } from '../utils';

export enum PRIORITY {
  HIGH = 10,
  MEDIUM = 5,
  LOW = 1,
}
export class MessageQueue {
  protected consumerTag: string | null;
  private logger: Logger;
  private hasEmitted = false;
  get isConnected(): boolean {
    return this.app.queueManager.isQueueConnected(this.queueName);
  }
  queueName: string;
  constructor(protected app: Application) {
    this.queueName = getQueueName(app.name);
    this.consumerTag = null;
    this.logger = createConsoleLogger();
  }
  async createQueue(): Promise<void> {
    try {
      await this.app.queueManager.createQueue(this.queueName, { durable: true });
    } catch (error) {
      this.logger.error('Workflow MessageQueue failed to create queue:', error);
    }
  }
  async sendMessage(message: string, priority = PRIORITY.LOW): Promise<void> {
    try {
      const messageId = this.app.queueManager.generateMessageId(message);
      await this.app.queueManager.sendMessage(this.queueName, message, {
        persistent: true,
        messageId,
        priority,
      });

      // 发送工作流相关队列消息后，触发子应用启动事件
      if (!this.hasEmitted) {
        this.app.emitAsync(SYSTEM_MANAGEMENT_SUB_APP_START_EVENT, this.app);
        this.hasEmitted = true; // 设置标志为 true
      }

      this.logger.debug(`Message sent to queue ${this.queueName}`, { payload: message });
    } catch (error) {
      this.logger.error('Failed to send message:', error);
    }
  }

  async consumeMessage(callback: (msg: string) => void): Promise<string> {
    try {
      if (this.consumerTag) {
        await this.cancelConsume();
      }
      this.consumerTag = await this.app.queueManager.consumeMessage(this.queueName, async (msg) => {
        if (msg !== null) {
          // const messageId = msg.properties.messageId;
          const data = msg.content.toString();
          this.logger.debug(`Started consuming messages from queue ${this.queueName}`, {
            payload: data,
          });
          await callback(data);
        }
      });
    } catch (error) {
      this.logger.error('Failed to consume message:', error);
    }
    return this.consumerTag;
  }

  async cancelConsume(): Promise<void> {
    if (this.consumerTag) {
      this.logger.info(`Cancel consumer, queue: ${this.queueName}, consumerTag: ${this.consumerTag}`);
      await this.app.queueManager.cancelConsume(this.queueName, this.consumerTag);
      this.consumerTag = null;
    }
  }
}
