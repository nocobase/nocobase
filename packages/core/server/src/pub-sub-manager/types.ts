/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface PubSubManagerOptions {
  channelPrefix?: string;
  publisherId?: string;
}

export interface PubSubManagerPublishOptions {
  skipSelf?: boolean;
  onlySelf?: boolean;
  // 目标应用
  targetApp?: string;
  // 发布消息时支持可设置防抖
  debounce?: number;
  // task worker
  taskWorkerCanPublish?: boolean;
}

export interface PubSubManagerSubscribeOptions {
  debounce?: number;
}

export type PubSubCallback = (message: any) => Promise<void>;

export interface IPubSubAdapter {
  isConnected(): Promise<boolean> | boolean;
  connect(): Promise<any>;
  close(): Promise<any>;
  subscribe(channel: string, callback: PubSubCallback): Promise<any>;
  unsubscribe(channel: string, callback: PubSubCallback): Promise<any>;
  publish(channel: string, message: string): Promise<any>;
}
