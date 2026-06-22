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
  PUBLIC_FORM_SUBMIT_ACTION_MODEL,
  PUBLIC_FORMS_NAMESPACE,
  PUBLIC_FORMS_SETTINGS_LAYOUT_MODEL,
} from './constants';

export class PluginPublicFormsClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.app.i18n.t('Public forms', { ns: PUBLIC_FORMS_NAMESPACE });

    this.flowEngine.registerModelLoaders({
      [PUBLIC_FORMS_SETTINGS_LAYOUT_MODEL]: {
        loader: () => import('./models/PublicFormsSettingsLayoutModel'),
      },
      [PUBLIC_FORM_LAYOUT_MODEL]: {
        loader: () => import('./models/PublicFormLayoutModel'),
      },
      [PUBLIC_FORM_PAGE_MODEL]: {
        loader: () => import('./models/PublicFormPageModel'),
      },
      [PUBLIC_FORM_SUBMIT_ACTION_MODEL]: {
        loader: () => import('./models/PublicFormSubmitActionModel'),
      },
    });

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
    });
  }
}

export default PluginPublicFormsClientV2;
