/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export abstract class NotificationServerBase {
  abstract send(args: { message: IMessage; channel: IChannel }): Promise<boolean>;
}

export interface IMessage {
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
  options: Record<string, any>;
  notificationType: string;
}

// export type NotificationServer = new () => NotificationServerBase;
export type NotificationServer = NotificationServerBase;

export type SendFnType = (args: { message: IMessage; channel: IChannel }) => Promise<boolean>;
