/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client-v2';
import { EMBED_LAYOUT_MODEL_CLASS, EMBED_LAYOUT_MODEL_UID } from './constants';
import { registerCopyEmbedLinkFlow } from './copyEmbedLinkFlow';
import { isEmbedRoutePathname } from './route';

const EMBED_ROUTE_PREFIX = '/embed';

export class PluginEmbedClientV2 extends Plugin<any, Application> {
  async beforeLoad() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    if (token && isEmbedRoutePathname(this.app, window.location.pathname)) {
      this.app.apiClient.storagePrefix = `${uid().toUpperCase()}_`;
      this.app.apiClient.storage = this.app.apiClient.createStorage('sessionStorage');
      this.app.apiClient.auth.setToken(token);
    }
  }

  async load() {
    this.app.flowEngine.registerModelLoaders({
      [EMBED_LAYOUT_MODEL_CLASS]: {
        loader: () => import('./EmbedLayoutModel'),
      },
    });
    this.app.layoutManager.registerLayout({
      routeName: 'embed',
      routePath: EMBED_ROUTE_PREFIX,
      uid: EMBED_LAYOUT_MODEL_UID,
      layoutModelClass: EMBED_LAYOUT_MODEL_CLASS,
      authCheck: false,
    });
    registerCopyEmbedLinkFlow();
  }
}

export default PluginEmbedClientV2;
