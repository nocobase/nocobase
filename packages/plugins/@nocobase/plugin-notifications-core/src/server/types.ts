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

interface IMessage {
  content: {
    body: string;
    type: 'html' | 'string';
  };
}

interface IChannel {
  options: Record<string, any>;
}

export type NotificationServer = new () => NotificationServerBase;
