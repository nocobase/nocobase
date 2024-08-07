/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import type { NotificationServer } from './types';

interface NotificatonType {
  Server: new () => NotificationServer;
}

export default class NotificationManager {
  notificationTypes = new Registry<{ server: NotificationServer }>();
  registerTypes(type: string, config: NotificatonType) {
    const server = new config.Server();
    this.notificationTypes.register(type, { server });
  }
}
