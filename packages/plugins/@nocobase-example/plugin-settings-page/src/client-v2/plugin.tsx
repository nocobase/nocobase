/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, Application } from '@nocobase/client-v2';
import React from 'react';

export class PluginSettingsPageClientV2 extends Plugin<any, Application> {
  async load() {
    // Register menu entryj
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings') as unknown as string,
      icon: 'ApiOutlined',
    });

    // Tab 1: API configuration (key='index' maps to menu root path)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration') as unknown as string,
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1,
    });

    // Tab 2: About page
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'about',
      title: this.t('About') as unknown as string,
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}

export default PluginSettingsPageClientV2;
