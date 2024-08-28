/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SendFnType, NotificationServerBase } from '@nocobase/plugin-notification-manager';
import { InAppMessageFormValues } from '../types';
export default class NotificationServer extends NotificationServerBase {
  send: SendFnType<InAppMessageFormValues> = async (options) => {
    const { channel, message } = options;
    const { senderId, content, receivers } = message;
    return [
      {
        receiver: 'a',
        status: 'success',
        content: '',
      },
    ];
  };
}
