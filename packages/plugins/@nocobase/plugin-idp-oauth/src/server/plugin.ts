/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { handleInteractionGet, handleInteractionPost } from './interaction';
import { createIdpOauthPaths } from './paths';
import { dispatchCurrentRequestToProvider } from './provider-dispatch';
import { IdpOauthService } from './service';
import { resolveCurrentUser } from './utils';

export class PluginIdpOauthServer extends Plugin {
  service: IdpOauthService;

  async load() {
    const bridgeTokenCache = await this.app.cacheManager.createCache({
      name: 'idp-oauth-token',
      prefix: 'idp-oauth:token',
      store: 'memory',
    });
    this.service = new IdpOauthService(this.app, bridgeTokenCache);
    const paths = createIdpOauthPaths();

    this.app.use(
      async (ctx, next) => {
        if (ctx.path.startsWith(paths.interactionPathPrefix)) {
          await next();
          return;
        }

        if (paths.isProviderPath(ctx.path)) {
          await dispatchCurrentRequestToProvider(ctx, this.service, paths.apiBasePath);
          return;
        }

        await next();
      },
      {
        tag: 'idp-oauth-provider',
        before: 'dataSource',
      },
    );

    this.app.use(
      async (ctx, next) => {
        await this.service.authenticateResourceRequest(ctx);
        await next();
      },
      {
        tag: 'idp-oauth-resource-auth',
        before: 'dataSource',
      },
    );

    this.app.use(
      async (ctx, next) => {
        if (!ctx.path.startsWith(paths.interactionPathPrefix)) {
          await next();
          return;
        }

        ctx.withoutDataWrapping = true;
        const provider = await this.service.ensureProviderForContext(ctx);
        const user = await resolveCurrentUser(ctx, this.service);

        if (ctx.method === 'GET') {
          await handleInteractionGet(ctx, provider, user, this.service);
          return;
        }

        if (ctx.method === 'POST') {
          await handleInteractionPost(ctx, provider, user, this.service);
          return;
        }

        ctx.throw(405);
      },
      {
        tag: 'idp-oauth-interaction',
        before: 'dataSource',
      },
    );
  }

  async remove() {}
}

export default PluginIdpOauthServer;
