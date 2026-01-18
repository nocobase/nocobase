/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginMobileClient as CorePluginMobileClient } from '@nocobase/client';
import { generatePluginTranslationTemplate } from './locale';

// Export JSBridge, attached to window.
import './js-bridge';
import { MobileSettings } from './mobile-blocks/settings-block/MobileSettings';
import { MobileSettingsBlockInitializer } from './mobile-blocks/settings-block/MobileSettingsBlockInitializer';
import { MobileSettingsBlockSchemaSettings } from './mobile-blocks/settings-block/schemaSettings';

export class PluginMobileClient extends CorePluginMobileClient {
  async load() {
    console.warn(
      '[NocoBase] @nocobase/plugin-mobile is deprecated and may be removed in future versions. Please migrate to the new mobile solution.',
    );

    await super.load();
    this.addMobileSettings();

    this.app.pluginSettingsManager.add('mobile', {
      title: generatePluginTranslationTemplate('Mobile (deprecated)'),
      icon: 'MobileOutlined',
      link: this.mobileBasename,
    });
  }

  addMobileSettings() {
    this.app.addComponents({
      MobileSettingsBlockInitializer,
      MobileSettings,
    });
    this.app.schemaSettingsManager.add(MobileSettingsBlockSchemaSettings);
  }
}

export default PluginMobileClient;
