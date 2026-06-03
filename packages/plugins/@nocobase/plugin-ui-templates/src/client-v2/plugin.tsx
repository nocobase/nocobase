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
import { NAMESPACE } from './locale';
import { registerMenuExtensions } from './menuExtensions';
import { registerOpenViewPopupTemplateAction } from './openViewActionExtensions';

const SETTINGS_MENU_KEY = 'ui-templates';
const SETTINGS_ACL_SNIPPET = 'pm.ui-templates.templates';

export class PluginUiTemplatesClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const t = (key: string) => this.app.i18n.t(key, { ns: NAMESPACE, nsMode: 'fallback' });

    this.flowEngine.registerModelLoaders({
      ReferenceBlockModel: {
        loader: () => import('./models/ReferenceBlockModel'),
      },
      ReferenceFormGridModel: {
        loader: () => import('./models/ReferenceFormGridModel'),
      },
      SubModelTemplateImporterModel: {
        loader: () => import('./models/SubModelTemplateImporterModel'),
      },
    });
    registerOpenViewPopupTemplateAction(this.flowEngine);
    registerMenuExtensions();

    this.pluginSettingsManager.addMenuItem({
      key: SETTINGS_MENU_KEY,
      title: t('UI templates'),
      icon: 'ProfileOutlined',
      aclSnippet: SETTINGS_ACL_SNIPPET,
      showTabs: true,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: SETTINGS_MENU_KEY,
      key: 'block',
      title: t('Block templates'),
      aclSnippet: SETTINGS_ACL_SNIPPET,
      componentLoader: () => import('./pages/BlockTemplatesPage'),
      sort: 0,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: SETTINGS_MENU_KEY,
      key: 'popup',
      title: t('Popup templates'),
      aclSnippet: SETTINGS_ACL_SNIPPET,
      componentLoader: () => import('./pages/PopupTemplatesPage'),
      sort: 10,
    });
  }
}

export default PluginUiTemplatesClientV2;
