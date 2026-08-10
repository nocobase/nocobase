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

export class PluginIdpOauthClientV2 extends Plugin<any, Application> {
  async load() {
    this.router.add('idp-oauth.interaction', {
      path: '/idp-oauth/interaction/:uid',
      componentLoader: () => import('./pages/InteractionPage'),
      skipAuthCheck: true,
    });
    this.router.add('idp-oauth.device', {
      path: '/idpOAuth/device',
      componentLoader: () => import('./pages/DevicePage'),
      skipAuthCheck: true,
    });
    this.router.add('idp-oauth.error', {
      path: '/idp-oauth/error',
      componentLoader: () => import('./pages/ErrorPage'),
      skipAuthCheck: true,
    });
  }
}

export default PluginIdpOauthClientV2;
