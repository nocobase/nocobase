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
import { registerCopyEmbedLinkFlow } from './copyEmbedLinkFlow';

const EMBED_ROUTE_PREFIX = '/embed';

function isEmbedPath(pathname: string, prefix: string) {
  const normalizedPrefix = prefix.replace(/\/$/, '');
  return pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`);
}

export class PluginEmbedClientV2 extends Plugin<any, Application> {
  async beforeLoad() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    const prefix = this.app.getRouteUrl(EMBED_ROUTE_PREFIX);

    if (token && isEmbedPath(window.location.pathname, prefix)) {
      this.app.apiClient.storagePrefix = `${uid().toUpperCase()}_`;
      this.app.apiClient.storage = this.app.apiClient.createStorage('sessionStorage');
      this.app.apiClient.auth.setToken(token);
    }
  }

  async load() {
    this.addRoutes();
    registerCopyEmbedLinkFlow();
  }

  private addRoutes() {
    this.router.add('embed', {
      path: EMBED_ROUTE_PREFIX,
      authCheck: true,
      componentLoader: () => import('./EmbedLayout'),
    });

    this.router.add('embed.index', {
      index: true,
      componentLoader: () => import('./EmbedEmptyPage'),
    });

    this.router.add('embed.page', {
      path: `${EMBED_ROUTE_PREFIX}/:name`,
      componentLoader: () => import('./EmbedFlowRoute'),
    });

    this.router.add('embed.page.tab', {
      path: `${EMBED_ROUTE_PREFIX}/:name/tab/:tabUid`,
      componentLoader: () => import('./EmbedFlowRoute'),
    });

    this.router.add('embed.page.view', {
      path: `${EMBED_ROUTE_PREFIX}/:name/view/*`,
      componentLoader: () => import('./EmbedFlowRoute'),
    });

    this.router.add('embed.page.tab.view', {
      path: `${EMBED_ROUTE_PREFIX}/:name/tab/:tabUid/view/*`,
      componentLoader: () => import('./EmbedFlowRoute'),
    });
  }
}

export default PluginEmbedClientV2;
