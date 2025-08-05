/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from './application';
import { QueueCallbackOptions, QueueEventOptions, QueueMessageOptions } from './event-queue';

export interface BackgroundJobManagerOptions {
  channel?: string;
}

type BackgroundJobMessage = {
  topic: string;
  payload: any;
};

type BackgroundJobEventOptions = Pick<QueueEventOptions, 'process' | 'idle'>;

class BackgroundJobManager {
  static DEFAULT_CHANNEL = 'background-jobs';

  private subscriptions: Map<string, BackgroundJobEventOptions> = new Map(); // topic -> handler
  private processing: Promise<void> | null = null;

  private get channel() {
    return this.options.channel ?? BackgroundJobManager.DEFAULT_CHANNEL;
  }

  private onAfterStart = () => {
    this.app.eventQueue.subscribe(this.channel, {
      idle: () => this.idle,
      process: this.process,
    });
  };

  private onBeforeStop = () => {
    this.app.eventQueue.unsubscribe(this.channel);
  };

  private process = async ({ topic, payload }: BackgroundJobMessage, options: QueueCallbackOptions): Promise<void> => {
    const event = this.subscriptions.get(topic);
    if (!event) {
      this.app.logger.warn(`No handler found for topic: ${topic}, event skipped.`);
      return;
    }
    // 设置处理状态
    this.processing = event.process(payload, options) as Promise<void>;

    try {
      await this.processing;
      this.app.logger.debug(`Completed background job ${topic}:${options.id}`);
    } catch (error) {
      this.app.logger.error(`Failed to process background job ${topic}:${options.id}`, error);
      throw error; // 让底层队列处理重试逻辑
    } finally {
      // 清理处理状态
      this.processing = null;
    }
  };

  constructor(
    private app: Application,
    private options: BackgroundJobManagerOptions = {},
  ) {
    this.app.on('afterStart', this.onAfterStart);
    this.app.on('beforeStop', this.onBeforeStop);
  }

  private get idle(): boolean {
    return !this.processing && [...this.subscriptions.values()].every((event) => event.idle());
  }

  /**
   * 订阅指定主题的任务处理器
   * @param options 订阅选项
   */
  public subscribe(topic: string, options: BackgroundJobEventOptions): void {
    if (this.subscriptions.has(topic)) {
      this.app.logger.warn(`Topic "${topic}" already has a handler, skip...`);
      return;
    }

    this.subscriptions.set(topic, options);
    this.app.logger.debug(`Subscribed to background job topic: ${topic}`);
  }

  /**
   * 取消订阅指定主题
   * @param topic 主题名称
   */
  public unsubscribe(topic: string): void {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.delete(topic);
      this.app.logger.debug(`Unsubscribed from background job topic: ${topic}`);
    }
  }

  public async publish(topic: string, payload: any, options?: QueueMessageOptions): Promise<void> {
    await this.app.eventQueue.publish(this.channel, { topic, payload }, options);
  }
}

export { BackgroundJobManager };
export default BackgroundJobManager;
