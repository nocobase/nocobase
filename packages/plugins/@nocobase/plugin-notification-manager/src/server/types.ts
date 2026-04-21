/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { BaseNotificationChannel } from './base-notification-channel';

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
export interface ChannelOptions {
  name: string;
  options: Record<string, any>;
  notificationType: string;
}

export type WriteLogOptions = {
  status: 'success' | 'failure';
  message: Record<string, any>;
  triggerFrom: string;
  reason?: string;
  channelName: string;
  channelTitle: string;
};

export type SendFnType<Message> = (args: {
  message: Message;
  channel: ChannelOptions;
  receivers?: ReceiversOptions;
  transaction?: Transactionable['transaction'];
}) => Promise<{ message: Message; status: 'success' | 'failure'; reason?: string }>;

export type ReceiversOptions =
  | { value: number[]; type: 'userId' }
  | { value: any; type: 'channel-self-defined'; channelType: string };
export interface SendOptions extends Transactionable {
  channelName: string;
  message: Record<string, any>;
  triggerFrom: string;
  receivers?: ReceiversOptions;
  data?: Record<string, any>;
}

export type NotificationQueueMessage = Omit<SendOptions, 'transaction'>;

export interface SendUserOptions extends Transactionable {
  userIds: number[];
  channels: string[];
  message: Record<string, any>;
  data?: Record<string, any>;
}

export type NotificationChannelConstructor = new (app: Application) => BaseNotificationChannel;
export type RegisterServerTypeFnParams = { type: string; Channel: NotificationChannelConstructor };
