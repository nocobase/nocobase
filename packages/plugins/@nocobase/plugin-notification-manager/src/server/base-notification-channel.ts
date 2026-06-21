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
import { ChannelOptions, ReceiversOptions } from './types';

export abstract class BaseNotificationChannel<Message = any> {
  constructor(protected app: Application) {}
  abstract send(params: {
    channel: ChannelOptions;
    message: Message;
    receivers?: ReceiversOptions;
    transaction?: Transactionable['transaction'];
  }): Promise<{ message: Message; status: 'success' | 'failure'; reason?: string }>;
}
