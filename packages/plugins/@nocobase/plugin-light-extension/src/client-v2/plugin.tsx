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

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY } from '../constants';

export class PluginLightExtensionClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.t('Light extensions');

    this.pluginSettingsManager.addMenuItem({
      key: LIGHT_EXTENSION_SETTINGS_KEY,
      title,
      icon: 'CodeOutlined',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'index',
      title,
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionListPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'source',
      title: this.t('Source'),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionWorkspacePage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      key: 'entries',
      title: this.t('Entries'),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
      componentLoader: () => import('./pages/LightExtensionEntriesPage'),
    });
  }
}

export default PluginLightExtensionClientV2;
