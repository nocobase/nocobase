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

export class PluginAPIKeysClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.t('API keys') as unknown as string;

    this.pluginSettingsManager.addMenuItem({
      key: 'api-keys',
      title,
      icon: 'KeyOutlined',
      aclSnippet: 'pm.api-keys.configuration',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'api-keys',
      key: 'index',
      title,
      componentLoader: () => import('./pages/ApiKeysPage'),
    });
  }
}

export default PluginAPIKeysClientV2;
