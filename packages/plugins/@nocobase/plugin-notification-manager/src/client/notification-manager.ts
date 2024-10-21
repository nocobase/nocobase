/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import { RegisterChannelOptions } from './manager/channel/types';

export default class NotificationManager {
  channelTypes = new Registry<RegisterChannelOptions>();
  registerChannelType(options: RegisterChannelOptions) {
    this.channelTypes.register(options.type, options);
  }
}
