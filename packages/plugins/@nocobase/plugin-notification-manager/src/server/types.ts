/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import PluginNotificationManagerServer from './plugin';
export type WriteLogOptions = {
  receiver: string;
  status: 'success' | 'fail';
  content: Record<string, any>;
  triggerFrom: string;
  reason?: string;
  channelId: string;
  channelTitle: string;
};

export type SendFnType<Message = {}> = (args: {
  message: Message & SendOptions;
  channel: IChannel;
}) => Promise<{ receivers: string[]; content: any; status: 'success' | 'fail'; reason?: string }>;
export abstract class NotificationServerBase {
  public pluginCtx: PluginNotificationManagerServer;

  setPluginCtx({ pluginCtx }: { pluginCtx: PluginNotificationManagerServer }) {
    this.pluginCtx = pluginCtx;
  }
  abstract send: SendFnType;
}

export interface SendOptions {
  receivers: string[];
  triggerFrom: string;
  channelId: string;
  content: Record<string, any>;
}

export interface IChannel {
  id: string;
  options: Record<string, any>;
  notificationType: string;
}

export type NotificationServer = NotificationServerBase;
