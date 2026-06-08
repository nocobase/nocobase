/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';
import { Registry } from '@nocobase/utils/client';
import React from 'react';

export type AsyncTaskRecord = {
  id: string;
  origin?: string;
  type?: string;
  title?: string;
  status?: number | null;
  result?: unknown;
  cancelable?: boolean;
  progressCurrent?: number | null;
  progressTotal?: number | null;
  createdAt?: string;
  params?: Record<string, unknown>;
};

export type TaskOrigin = {
  Result?: React.ComponentType<{ payload: unknown; task: AsyncTaskRecord }>;
  ResultButton?: React.ComponentType<{ task: AsyncTaskRecord }>;
  namespace?: string;
};

export class PluginAsyncTaskManagerClientV2 extends Plugin<Record<string, never>, Application> {
  taskOrigins: Registry<TaskOrigin> = new Registry();

  async load() {
    this.flowEngine.registerModelLoaders({
      AsyncTasksTopbarActionModel: {
        extends: 'TopbarActionModel',
        loader: () => import('./models/AsyncTasksTopbarActionModel'),
      },
    });

    this.app.eventBus.dispatchEvent(new CustomEvent('plugin:async-task-manager:loaded', { detail: this }));
  }
}

export default PluginAsyncTaskManagerClientV2;
