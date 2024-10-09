/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import { ChannelType } from './manager/channel/types';
import { merge } from '@nocobase/utils/client';
export default class NotificationManager {
  channelTypes = new Registry<ChannelType>();
  registerChannelType(options: ChannelType) {
    const mergedOptions = merge(
      { meta: { createable: true, editable: true, deletable: true } },
      options,
    ) as ChannelType;
    this.channelTypes.register(options.key, mergedOptions);
  }
}
