/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import { usePlugin } from '@nocobase/client';
import { createContext } from 'react';
import PluginNotificationManagerClient from '..';
import { useNotificationTranslation } from '../locale';
import { RegisterChannelOptions } from '../manager/channel/types';

export const ChannelTypeMapContext = createContext<{
  typeMap: Record<string, RegisterChannelOptions>;
}>({ typeMap: {} });
ChannelTypeMapContext.displayName = 'ChannelTypesContext';

export const useChannelTypeMap = () => {
  const { t } = useNotificationTranslation();
  const plugin = usePlugin(PluginNotificationManagerClient);
  const notificationTypeMap: Record<string, RegisterChannelOptions> = {};
  for (const [key, val] of plugin.channelTypes.getEntities()) {
    const type = {
      ...val,
      title: Schema.compile(val.title, { t }) as string,
    };
    notificationTypeMap[val.type] = type;
  }
  return notificationTypeMap;
};
