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
import { API_DOC_ACL, DOCUMENTATION_PATH, NAMESPACE } from './constants';

export class PluginAPIDocClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const title = this.app.i18n.t('API documentation', { ns: NAMESPACE });

    this.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title,
      icon: 'BookOutlined',
      aclSnippet: API_DOC_ACL,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      title,
      componentLoader: () => import('./pages/DocumentationPreview'),
      aclSnippet: API_DOC_ACL,
    });

    this.router.add('api-documentation', {
      path: DOCUMENTATION_PATH,
      componentLoader: () => import('./pages/Documentation'),
    });
  }
}

export default PluginAPIDocClientV2;
