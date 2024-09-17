/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import PluginNotificationManagerServer from './plugin';
export interface Channel {
  id: string;
  options: Record<string, any>;
  notificationType: string;
}

export type WriteLogOptions = {
  receiver: string;
  status: 'success' | 'fail';
  content: Record<string, any>;
  triggerFrom: string;
  reason?: string;
  channelId: string;
  channelTitle: string;
};

export type SendFnType<Message> = (args: {
  message: Message;
  channel: Channel;
}) => Promise<{ message: Message; status: 'success' | 'fail'; reason?: string }>;

export abstract class NotificationServerBase<Message = any> {
  public pluginCtx: PluginNotificationManagerServer;

  setPluginCtx({ pluginCtx }: { pluginCtx: PluginNotificationManagerServer }) {
    this.pluginCtx = pluginCtx;
  }
  abstract send(params: { channel: Channel; message: Message }): Promise<any>;
}

export interface SendOptions {
  channelId: string;
  content: {
    body: string;
    type: 'html' | 'string';
    config: Record<string, any>;
  };
  receivers: string[];
  triggerFrom: string;
}
