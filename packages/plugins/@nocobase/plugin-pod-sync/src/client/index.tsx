/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import SettingPage from './SettingPage';

export class PluginPodSyncClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()

    if (this.app.name === 'main') {
      this.app.pluginSettingsManager.add(`system-management`, {
        icon: 'ControlOutlined',
        title: this.t('system management'),
        Component: SettingPage,
        aclSnippet: `system-management.setting`,
      });
    }
  }
}

export default PluginPodSyncClient;
