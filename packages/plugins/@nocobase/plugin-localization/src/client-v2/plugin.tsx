/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { MissingKeyHandler } from './i18n-missing-handler';
import { LOCALIZATION_ACL_SNIPPET, LOCALIZATION_SETTINGS_KEY } from './common/constants';

export class PluginLocalizationClientV2 extends Plugin<any, Application> {
  async load() {
    const missingKeyHandler = new MissingKeyHandler(this.context);
    missingKeyHandler.register();

    this.pluginSettingsManager.addMenuItem({
      key: LOCALIZATION_SETTINGS_KEY,
      title: this.t('Localization'),
      icon: 'GlobalOutlined',
      aclSnippet: LOCALIZATION_ACL_SNIPPET,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: LOCALIZATION_SETTINGS_KEY,
      key: 'index',
      title: this.t('Localization'),
      componentLoader: () => import('./pages/LocalizationPage'),
    });
  }
}

export default PluginLocalizationClientV2;
