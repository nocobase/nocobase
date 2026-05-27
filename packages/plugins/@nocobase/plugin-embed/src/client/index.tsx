/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { uid } from '@formily/shared';
import { PageTabs, Plugin } from '@nocobase/client';
import { registerCopyEmbedLinkFlow } from '../client-v2/copyEmbedLinkFlow';
import { EmbedLayout, EmbedPage, useBlockSettingProps } from './EmbedLayout';

const Key = 'embed';
const UrlPrefix = `/${Key}`;

class PluginEmbedClient extends Plugin {
  async beforeLoad() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const prefix = this.app.getRouteUrl('embed');
    if (token && window.location.pathname.startsWith(prefix)) {
      this.app.apiClient.storagePrefix = `${uid().toUpperCase()}_`;
      this.app.apiClient.storage = this.app.apiClient.createStorage('sessionStorage');
      this.app.apiClient.auth.setToken(token);
    }
  }
  async load() {
    this.router.add(Key, {
      path: UrlPrefix,
      Component: EmbedLayout,
      skipAuthCheck: true,
    });

    this.router.add(`${Key}.page`, {
      path: `${UrlPrefix}/:name`,
      Component: EmbedPage,
      skipAuthCheck: true,
    });

    this.router.add(`${Key}.page.tab`, {
      path: `${UrlPrefix}/:name/tabs/:tabUid`,
      Component: PageTabs,
      skipAuthCheck: true,
    });

    this.router.add(`${Key}.page.flowTab`, {
      path: `${UrlPrefix}/:name/tab/:tabUid`,
      Component: EmbedPage,
      skipAuthCheck: true,
    });

    this.router.add(`${Key}.page.view`, {
      path: `${UrlPrefix}/:name/view/*`,
      Component: EmbedPage,
      skipAuthCheck: true,
    });

    this.router.add(`${Key}.page.flowTabView`, {
      path: `${UrlPrefix}/:name/tab/:tabUid/view/*`,
      Component: EmbedPage,
      skipAuthCheck: true,
    });

    this.schemaSettingsManager.addItem('PageSettings', Key, {
      type: 'item',
      useComponentProps: useBlockSettingProps,
    });

    registerCopyEmbedLinkFlow();
  }
}

export default PluginEmbedClient;
