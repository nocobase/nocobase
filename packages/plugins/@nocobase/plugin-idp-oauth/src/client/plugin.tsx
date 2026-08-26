/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { ErrorPage } from './ErrorPage';
import { InteractionPage } from './InteractionPage';
import models from './models';

export class PluginIdpOauthClient extends Plugin {
  async load() {
    const plugin = this as any;
    plugin.flowEngine.registerModels(models);
    plugin.router.add('idp-oauth.interaction', {
      path: '/idp-oauth/interaction/:uid',
      Component: InteractionPage,
      skipAuthCheck: true,
    });
    plugin.router.add('idp-oauth.error', {
      path: '/idp-oauth/error',
      Component: ErrorPage,
      skipAuthCheck: true,
    });
  }
}

export default PluginIdpOauthClient;
