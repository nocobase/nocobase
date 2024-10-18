/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { Icon, PinnedPluginListProvider, SchemaComponentOptions, useApp, useRequest } from '@nocobase/client';
import { Inbox } from './components/Inbox';
export const MessageManagerProvider = (props: any) => {
  return (
    <PinnedPluginListProvider
      items={{
        inbox: { order: 301, component: 'Inbox', pin: true, snippet: '*' },
      }}
    >
      <SchemaComponentOptions components={{ Inbox }}>{props.children}</SchemaComponentOptions>
    </PinnedPluginListProvider>
  );
};
