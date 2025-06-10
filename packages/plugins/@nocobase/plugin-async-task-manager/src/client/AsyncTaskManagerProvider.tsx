/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PinnedPluginListProvider, SchemaComponentOptions, useRequest } from '@nocobase/client';
import React from 'react';
import { AsyncTasks } from './components/AsyncTasks';

export const AsyncTaskManagerProvider = (props) => {
  return (
    <PinnedPluginListProvider
      items={{
        asyncTasks: { order: 300, component: 'AsyncTasks', pin: true, snippet: '*' },
      }}
    >
      <SchemaComponentOptions components={{ AsyncTasks }}>{props.children}</SchemaComponentOptions>
    </PinnedPluginListProvider>
  );
};
