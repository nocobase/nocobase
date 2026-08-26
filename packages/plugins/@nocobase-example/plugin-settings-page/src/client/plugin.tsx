/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import ExternalApiSettingsPage from './pages/ExternalApiSettingsPage';

export class PluginSettingsPageClient extends Plugin {
  async load() {
    this.pluginSettingsManager.add('external-api', {
      title: this.t('External API Settings'),
      icon: 'ApiOutlined',
      Component: ExternalApiSettingsPage,
    });
  }
}

export default PluginSettingsPageClient;
