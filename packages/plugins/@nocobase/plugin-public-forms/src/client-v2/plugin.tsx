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
import {
  PUBLIC_FORM_LAYOUT_MODEL,
  PUBLIC_FORM_LAYOUT_UID,
  PUBLIC_FORM_PAGE_MODEL,
  PUBLIC_FORM_ROUTE_NAME,
  PUBLIC_FORMS_NAMESPACE,
} from './constants';
import { registerPublicFormV2ModelLoaders } from './modelLoaders';

export class PluginPublicFormsClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.app.i18n.t('Public forms', { ns: PUBLIC_FORMS_NAMESPACE });

    registerPublicFormV2ModelLoaders(this.flowEngine);

    this.pluginSettingsManager.addMenuItem({
      key: PUBLIC_FORMS_NAMESPACE,
      title,
      icon: 'TableOutlined',
      aclSnippet: 'pm.public-forms',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: PUBLIC_FORMS_NAMESPACE,
      key: 'index',
      title,
      componentLoader: () => import('./pages/PublicFormsSettingsPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: PUBLIC_FORMS_NAMESPACE,
      key: ':name',
      title: false,
      hidden: true,
      componentLoader: () => import('./pages/PublicFormsSettingsDetailPage'),
    });

    this.app.layoutManager.registerLayout({
      routeName: PUBLIC_FORM_ROUTE_NAME,
      routePath: '/public-forms',
      uid: PUBLIC_FORM_LAYOUT_UID,
      layoutModelClass: PUBLIC_FORM_LAYOUT_MODEL,
      rootPageModelClass: PUBLIC_FORM_PAGE_MODEL,
      authCheck: false,
      storageScope: {
        storageType: 'sessionStorage',
        prefix: 'PUBLIC_FORM',
      },
    });
  }
}

export default PluginPublicFormsClientV2;
