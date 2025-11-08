/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import { Plugin } from '@nocobase/client';
import { AsyncTaskManagerProvider } from './AsyncTaskManagerProvider';

type TaskOrigin = {
  Result?: React.ComponentType<any>;
  ResultButton?: React.ComponentType<any>;
};

export class PluginAsyncTaskManagerClient extends Plugin {
  taskOrigins: Registry<TaskOrigin> = new Registry();

  async load() {
    this.app.use(AsyncTaskManagerProvider);
  }
}

export default PluginAsyncTaskManagerClient;
