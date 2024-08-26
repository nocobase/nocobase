/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { MessageManagerProvider } from './MessageManagerProvider';
export class PluginNotificationInAppClient extends Plugin {
  async afterAdd() {
    this.app.use(MessageManagerProvider);
  }
  async beforeLoad() {}

  async load() {
    console.log(this.app);
  }
}

export default PluginNotificationInAppClient;
