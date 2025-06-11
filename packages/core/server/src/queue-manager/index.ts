/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import amqp, { Connection, Channel, Options, ConsumeMessage } from 'amqplib';
import * as fakeAmqplib from '@onify/fake-amqplib';
import crypto from 'crypto';
import { getAmqpUrl, getAmqpConnectionOptions } from './utils';
import { Logger, createConsoleLogger } from '@nocobase/logger';
import Application from '../application';

export type ConsumeMessageCallbackOptions = {
  channel: Channel;
  msg: ConsumeMessage;
};

export type ConsumeMessageCallback = (
  msg: ConsumeMessage | null,
  options: ConsumeMessageCallbackOptions,
) => Promise<void>;

export type ConsumeMessageConfig = {
  queueName: string;
  consumerTag: string;
  callback: ConsumeMessageCallback;
  options: Options.Consume;
};

export const createQueueManager = (app: Application): QueueManager => {
  if (app.queueManager) {
    return app.queueManager;
  }

  app.on('beforeStart', async (curApp) => {
    try {
      curApp.logger?.info('QueueManager connecting to RabbitMQ...');
      curApp.queueManager.setLogger(curApp.logger);
      await curApp.queueManager.connect();
    } catch (error) {
      curApp.queueManager.logger?.error('Failed to connect to RabbitMQ after app start:', error);
    }
  });

  app.on('afterStop', async function () {
    this.logger?.info('QueueManager closing...');
    await this.queueManager.close();
  });

  const queueManager = new QueueManager();

  return queueManager;
};

export default class QueueManager {
  static SERVER_CLOSE_CODES: number[] = [320]; // todo jak 兼容阿里云
  private url: string;
  private connection: Connection | null;
  private channels: Map<string, Channel>;
  private consumeConfigs: ConsumeMessageConfig[];
  private logger: Logger | null = null;
  private isClosing = false;

  // 是否在子进程中
  get isChildProcess(): boolean {
    return process.env.IN_CHILD_PROCESS === 'true';
  }

  get isConnected(): boolean {
    return this.connection !== null;
  }

  isQueueConnected(queueName: string): boolean {
    const channel = this.channels.get(queueName);
    return this.isConnected && channel !== null;
  }

  constructor() {
    this.url = getAmqpUrl();
    this.connection = null;
    this.channels = new Map();
    this.consumeConfigs = [];
    this.logger = createConsoleLogger();
  }

  setLogger(logger: Logger) {
    this.logger = logger;
  }

  async connect(retries = 5, delay = 2000): Promise<void> {
    if (this.isChildProcess) {
      this.logger?.warn('QueueManager is disabled in child process. Skipping connect.');
      return;
    }

    const connectionOptions = getAmqpConnectionOptions();
    const maskOptions = { ...connectionOptions, username: '***', password: '******' };

    this.logger?.info(
      `Connecting to rabbitMQ ${
        process.env.__E2E__ ? `at ${this.url}` : `with options: ${JSON.stringify(maskOptions)}`
      }`,
      {
        isConnected: this.isConnected,
      },
    );

    if (!this.isConnected) {
      while (retries > 0) {
        try {
          if (process.env.__E2E__ || process.env.__TEST__) {
            this.connection = await fakeAmqplib.connect(this.url);
          } else {
            this.connection = await amqp.connect(connectionOptions);
          }
          this.logger?.info(`QueueManager rabbitMQ connected successfully!!!`);
          await this.setReconnect();
          return;
        } catch (error) {
          this.logger?.error('Failed to connect to RabbitMQ:', error);
          retries -= 1;
          if (retries > 0) {
            this.logger?.info(`Retrying to connect in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
    }
  }

  /**
   * 设置MQ异常重连机制
   */
  async setReconnect(retries = 100000, delay = 2000): Promise<void> {
    if (this.isConnected) {
      this.connection.on('error', (conError) => {
        this.logger?.error('QueueManager RabbitMQ error', conError);
      });
      this.connection.on('close', async (closeParam) => {
        this.logger?.error('QueueManager connection on close', closeParam);
        if (!QueueManager.SERVER_CLOSE_CODES.includes(closeParam?.code)) {
          return;
        }

        // 在异常断开后执行重连
        this.logger?.error('QueueManager connection close with code', closeParam);
        try {
          const oldConfigs = [...this.consumeConfigs];
          this.logger?.info('QueueManager RabbitMQ start reconnect');

          await this.close(true);
          await this.connect(retries, delay);
          if (!this.isConnected) {
            this.logger?.error('QueueManager RabbitMQ failed reconnect');
            return;
          }

          // 重连成功后恢复消费订阅
          this.logger?.info('QueueManager RabbitMQ success reconnect');
          for (let i = oldConfigs.length - 1; i >= 0; i--) {
            if (!oldConfigs[i]) {
              continue;
            }
            await this.consumeMessage(oldConfigs[i].queueName, oldConfigs[i].callback, oldConfigs[i].options);
          }
        } catch (reConError) {
          this.logger?.error('MessageQueue reconnect to RabbitMQ close', reConError);
        }
      });
      this.logger?.info('QueueManager setReconnect success');
    }
  }

  async close(ignoreException = false): Promise<void> {
    this.isClosing = true; // 设置标志位为主动关闭
    try {
      await this.cancelAllConsume();
    } catch (error) {
      if (!ignoreException) {
        this.logger?.info('QueueManager close cancelAllConsume error', error);
      }
    }

    try {
      for (const channel of this.channels.values()) {
        await channel.close();
      }
    } catch (error) {
      if (!ignoreException) {
        this.logger?.info('QueueManager close channel.close error', error);
      }
    } finally {
      this.channels.clear();
    }

    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        if (!ignoreException) {
          this.logger?.info('QueueManager close connection.close error', error);
        }
      } finally {
        this.connection = null;
        this.logger?.info(`QueueManager RabbitMQ closed`);
      }
    }
    this.isClosing = false; // 重置标志位
  }

  private async createChannel(queueName: string): Promise<Channel> {
    if (!this.connection) {
      throw new Error('No connection available');
    }
    const channel = await this.connection.createChannel();

    // 添加事件监听器，处理通道关闭的情况
    channel.on('close', async () => {
      if (!this.isClosing) {
        this.logger?.error(`Channel for queue ${queueName} closed, recreating...`);
        this.channels.delete(queueName); // 删除已关闭的通道
        try {
          const newChannel = await this.createChannel(queueName);
          this.channels.set(queueName, newChannel);
          this.logger?.info(`Channel for queue ${queueName} recreated successfully`);

          // 恢复消费者
          const configs = this.consumeConfigs.filter((config) => config.queueName === queueName);
          for (const config of configs) {
            await this.consumeMessage(config.queueName, config.callback, config.options);
          }
        } catch (error) {
          this.channels.set(queueName, null);
          this.logger?.error(`Failed to recreate channel for queue ${queueName}:`, error);
        }
      }
    });

    return channel;
  }
  // 交换机名称或队列名称
  async getChannel(name: string): Promise<Channel> {
    if (this.channels.has(name)) {
      const channel = this.channels.get(name);
      if (channel && !channel.connection) {
        // 如果通道已关闭，重新创建通道
        this.channels.delete(name);
      } else {
        return channel;
      }
    }
    const channel = await this.createChannel(name);
    this.channels.set(name, channel);
    return channel;
  }

  async createQueue(queueName: string, options?: Options.AssertQueue): Promise<void> {
    if (this.isChildProcess) {
      this.logger?.warn(`QueueManager is disabled in child process. Skipping createQueue for ${queueName}.`);
      return;
    }

    try {
      const channel = await this.getChannel(queueName);
      await channel.assertQueue(queueName, options);
      const frameMax = ((channel.connection as any)?.frameMax || 0) / 1024;
      this.logger?.info(`Create Queue: ${queueName}, frameMax: ${frameMax} KB`, {
        options,
        frameMax: `${frameMax} KB`,
      });
    } catch (error) {
      this.logger?.error(`Failed to create queue ${queueName}:`, error);
      throw error;
    }
  }
  /**
   * 发送消息到队列
   * @param queueName - 队列名称
   * @param message - 消息内容
   * @param options - 消息发送选项
   */
  async sendMessage(queueName: string, message: string | Buffer, options?: Options.Publish): Promise<void> {
    try {
      const msgSize = this.getMessageSize(message);
      const channel = await this.getChannel(queueName);
      channel.sendToQueue(queueName, Buffer.from(message), options);
      this.logger?.debug(`SendToQueue: ${queueName}, size: ${msgSize} KB`, { payload: message });
    } catch (error) {
      this.logger?.error(`Failed to send message to queue ${queueName}:`, error);
    }
  }
  /**
   * 消费消息
   * @param queueName - 队列名称
   * @param callback - 消费消息的回调函数
   * @param options - 消费选项
   */
  async consumeMessage(
    queueName: string,
    callback: ConsumeMessageCallback,
    // externalAck为true时，需要在callback中手动调用channel.ack(msg)或channel.nack(msg)来确认消息
    options: Options.Consume & { externalAck?: boolean } = {},
  ): Promise<string> {
    if (this.isChildProcess) {
      this.logger?.warn(`QueueManager is disabled in child process. Skipping consumeMessage for ${queueName}.`);
      return;
    }

    const { externalAck, ...restOptions } = options;
    this.logger?.debug(`Set consume queue: ${queueName}`, { options });
    try {
      const channel = await this.getChannel(queueName);
      await channel.prefetch(options?.arguments?.prefetchCount || 1); // 使用配置的预取计数，默认为1
      const res = await channel.consume(
        queueName,
        async (msg) => {
          if (msg) {
            try {
              const messageId = msg.properties.messageId;
              this.logger?.info(`Consume Message: ${queueName}`, { messageId });
              await callback(msg, { channel, msg });
              this.logger?.info(`Consume Acknowledge: ${queueName}`, { messageId });
              if (!options.noAck && !options.externalAck) {
                channel.ack(msg);
              }
            } catch (error) {
              if (!options.noAck) {
                channel.nack(msg);
              }
              this.logger?.error(`Failed to consume message from queue ${queueName}:`, error);
            }
          }
        },
        restOptions,
      );
      this.consumeConfigs.push({ queueName, callback, options, consumerTag: res.consumerTag });
      this.logger?.info(`Set consume queue: ${queueName}, consumerTag: ${res.consumerTag}`);
      return res.consumerTag;
    } catch (error) {
      this.logger?.error(`Failed to set consume for queue ${queueName}:`, error);
      throw error;
    }
  }

  async cancelConsume(queueName: string, consumerTag: string): Promise<void> {
    try {
      const channel = await this.getChannel(queueName);
      await channel.cancel(consumerTag);
      this.removeConsumeConfig(queueName, consumerTag);
      this.logger?.debug(`Cancel Consumer: queueName: ${queueName} consumerTag: ${consumerTag}`);
    } catch (error) {
      this.logger?.error(`Failed to cancel ${queueName} consumerTag: ${consumerTag}`, error);
    }
  }

  /**
   * 取消MQ消费
   */
  async cancelAllConsume() {
    for (let i = this.consumeConfigs.length - 1; i >= 0; i--) {
      await this.cancelConsume(this.consumeConfigs[i]?.queueName, this.consumeConfigs[i]?.consumerTag);
    }
    this.consumeConfigs = [];
  }

  /**
   * 移除MQ消费配置（不传任何参数则移除全部配置）
   * @param queueName 按queueName进行移除；不传则在移除时不过滤queueName
   * @param consumerTag 按consumerTag进行移除；不传则在移除时不过滤consumerTag
   */
  async removeConsumeConfig(queueName?: string, consumerTag?: string) {
    for (let i = this.consumeConfigs.length - 1; i >= 0; i--) {
      if (
        (!queueName || this.consumeConfigs[i]?.queueName === queueName) &&
        (!consumerTag || this.consumeConfigs[i]?.consumerTag === consumerTag)
      ) {
        this.consumeConfigs.splice(i, 1);
      }
    }
  }

  async deleteQueue(queueName: string): Promise<void> {
    try {
      const channel = await this.getChannel(queueName);
      await channel.deleteQueue(queueName);
      this.removeConsumeConfig(queueName);
      this.logger?.info(`Delete Queue: ${queueName}`);
    } catch (error) {
      this.logger?.error(`Failed to delete queue ${queueName}:`, error);
    }
  }
  public getMessageSize(message: string | Buffer): number {
    const messageBuffer = Buffer.isBuffer(message) ? message : Buffer.from(message);
    const msgSize = parseFloat((messageBuffer.length / 1024).toFixed(2));
    return msgSize;
  }
  public generateMessageId(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * 创建交换机
   * @param exchangeName - 交换机名称
   * @param type - 交换机类型（direct, fanout, topic, headers）
   * @param options - 交换机配置选项
   */
  public async createExchange(exchangeName: string, type: string, options?: Options.AssertExchange): Promise<void> {
    try {
      const channel = await this.getChannel(exchangeName);
      await channel.assertExchange(exchangeName, type, options);
      this.logger?.info(`Create Exchange: ${exchangeName}`, { type, options });
    } catch (error) {
      this.logger?.error(`Failed to create exchange ${exchangeName}:`, error);
      throw error;
    }
  }
  /**
   * 绑定队列到交换机
   * @param queueName - 队列名称
   * @param exchangeName - 交换机名称
   * @param routingKey - 路由键
   */
  public async bindQueue(queueName: string, exchangeName: string, routingKey: string): Promise<void> {
    try {
      const channel = await this.getChannel(queueName);
      await channel.bindQueue(queueName, exchangeName, routingKey);
      this.logger?.info(`Bind Queue: ${queueName} to Exchange: ${exchangeName} with Routing Key: ${routingKey}`);
    } catch (error) {
      this.logger?.error(`Failed to bind queue ${queueName} to exchange ${exchangeName}:`, error);
      throw error;
    }
  }

  /**
   * 发送消息到交换机
   * @param exchangeName - 交换机名称
   * @param routingKey - 路由键
   * @param message - 消息内容
   * @param options - 消息发送选项
   */
  public async sendMessageToExchange(
    exchangeName: string,
    routingKey: string,
    message: string | Buffer,
    options?: Options.Publish,
  ): Promise<void> {
    try {
      const msgSize = this.getMessageSize(message);
      const channel = await this.getChannel(exchangeName);
      channel.publish(exchangeName, routingKey, Buffer.from(message), options);
      this.logger?.debug(`SendToExchange: ${exchangeName}, RoutingKey: ${routingKey}, size: ${msgSize} KB`, {
        payload: message,
      });
    } catch (error) {
      this.logger?.error(`Failed to send message to exchange ${exchangeName} with routing key ${routingKey}:`, error);
    }
  }
}
