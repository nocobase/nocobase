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
const EMBED_STORAGE_PREFIX = 'NOCOBASE_EMBED';
const EMBED_WINDOW_NAME_PREFIX = '__nocobase_embed_';

type EmbedAppLike = {
  router?: {
    getBasename?: () => string | undefined;
  };
  getPublicPath?: () => string;
};

function hashStorageSegment(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36).toUpperCase();
}

function getEmbedWindowName() {
  if (!window.name) {
    window.name = `${EMBED_WINDOW_NAME_PREFIX}${uid()}`;
  }

  return window.name;
}

function getEmbedStoragePrefix(app: EmbedAppLike) {
  const appScope = app.router?.getBasename?.() || app.getPublicPath?.() || window.location.origin;
  const frameScope = getEmbedWindowName();

  return `${EMBED_STORAGE_PREFIX}_${hashStorageSegment(appScope)}_${hashStorageSegment(frameScope)}_`;
}

export class PluginEmbedClientV2 extends Plugin<any, Application> {
  async beforeLoad() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    if (isEmbedRoutePathname(this.app, window.location.pathname)) {
      const originalStoragePrefix = this.app.apiClient.storagePrefix;
      const originalStorage = this.app.apiClient.storage;

      this.app.apiClient.storagePrefix = getEmbedStoragePrefix(this.app);
      this.app.apiClient.storage = this.app.apiClient.createStorage('sessionStorage');

      if (token) {
        this.app.apiClient.auth.setToken(token);
        return;
      }

      if (!this.app.apiClient.auth.getToken()) {
        this.app.apiClient.storagePrefix = originalStoragePrefix;
        this.app.apiClient.storage = originalStorage;
      }
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
