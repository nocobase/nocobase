/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
}) => Promise<{ message: Message; status: 'success' | 'fail'; reason?: string }>;

export interface SendOptions {
  channelName: string;
  message: Record<string, any>;
  triggerFrom: string;
}

export type NotificationChannelConstructor = new (app: Application) => BaseNotificationChannel;
export type RegisterServerTypeFnParams = { type: string; Channel: NotificationChannelConstructor };
