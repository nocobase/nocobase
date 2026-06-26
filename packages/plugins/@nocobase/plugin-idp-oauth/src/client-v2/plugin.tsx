/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import models from './models';

export class PluginIdpOauthClientV2 extends Plugin {
  async load() {
    this.app.flowEngine.registerModels(models);
    this.router.add('idp-oauth.interaction', {
      path: '/idp-oauth/interaction/:uid',
      skipAuthCheck: true,
      componentLoader: () => import('./pages/InteractionPage'),
    });
    this.router.add('idp-oauth.error', {
      path: '/idp-oauth/error',
      skipAuthCheck: true,
      componentLoader: () => import('./pages/ErrorPage'),
    });
  }
}

export default PluginIdpOauthClientV2;
