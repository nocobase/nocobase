/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type WriteLogOptions = {
  receiver: string;
  status: 'success' | 'fail';
  content: Record<string, any>;
  triggerFrom: string;
  reason?: string;
  channelId: string;
};

export type SendFnType = (args: {
  message: SendOptions;
  channel: IChannel;
  createSendingRecord: (options: WriteLogOptions) => Promise<any>;
}) => Promise<any>;
export abstract class NotificationServerBase {
  abstract send: SendFnType;
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

export interface IChannel {
  id: string;
  options: Record<string, any>;
  notificationType: string;
}

// export type NotificationServer = new () => NotificationServerBase;
export type NotificationServer = NotificationServerBase;
