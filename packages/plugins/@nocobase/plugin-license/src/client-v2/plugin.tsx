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

export class PluginLicenseClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.t('License settings') as unknown as string;

    this.pluginSettingsManager.addMenuItem({
      key: 'license-settings',
      title,
      icon: 'SolutionOutlined',
      aclSnippet: 'pm.license-settings',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'license-settings',
      key: 'index',
      title,
      aclSnippet: 'pm.license-settings',
      componentLoader: () => import('./pages/LicenseSetting'),
    });
  }
}

export default PluginLicenseClientV2;
