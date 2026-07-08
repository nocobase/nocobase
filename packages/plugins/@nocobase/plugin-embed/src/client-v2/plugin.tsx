/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { EMBED_LAYOUT_MODEL_CLASS, EMBED_LAYOUT_MODEL_UID } from './constants';
import { registerCopyEmbedLinkFlow } from './copyEmbedLinkFlow';
import { EmbedSessionProvider, syncEmbedSessionFromLocation } from './embedSession';

const EMBED_ROUTE_PREFIX = '/embed';

export class PluginEmbedClientV2 extends Plugin<any, Application> {
  async beforeLoad() {
    syncEmbedSessionFromLocation(this.app);
  }

  async load() {
    this.app.providers.unshift([EmbedSessionProvider, {}]);
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
