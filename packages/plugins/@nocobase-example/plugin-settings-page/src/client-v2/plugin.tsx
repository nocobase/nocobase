/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class PluginSettingsPageClientV2 extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('external-api', {
      title: this.t('External API Settings'),
      icon: 'ApiOutlined',
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
    });
  }
}

export default PluginSettingsPageClientV2;
