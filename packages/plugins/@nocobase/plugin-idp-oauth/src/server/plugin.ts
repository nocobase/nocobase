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
import { IdpOauthService, OidcClientResolver } from './service';
import { resolveCurrentUser } from './utils';

export class PluginIdpOauthServer extends Plugin {
  service: IdpOauthService;
  private readonly clientResolvers = new Map<string, OidcClientResolver>();

  registerClientResolver(name: string, resolver: OidcClientResolver) {
    this.clientResolvers.set(name, resolver);
    this.service?.registerClientResolver(name, resolver);
  }

  unregisterClientResolver(name: string) {
    this.clientResolvers.delete(name);
    this.service?.unregisterClientResolver(name);
  }

  private registerDefaultApiResource() {
    this.service.registerResourceServer('api', {
      path: '/',
      scope: 'api',
      accessTokenFormat: 'jwt',
      jwt: {
        sign: { alg: 'RS256' },
      },
    });
  }

  async load() {
    const bridgeTokenCache = await this.app.cacheManager.createCache({
      name: 'idp-oauth-token',
      prefix: 'idp-oauth:token',
      store: 'memory',
    });
    this.service = new IdpOauthService(this.app, bridgeTokenCache);
    for (const [name, resolver] of this.clientResolvers) {
      this.service.registerClientResolver(name, resolver);
    }
    this.app.on('auth:signOut', async ({ ctx }) => {
      try {
        await this.service.destroyProviderSession(ctx);
      } catch (error) {
        ctx.logger?.warn?.('failed to destroy idp-oauth provider session', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
    this.registerDefaultApiResource();
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
        after: 'bodyParser',
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

  async remove() {
    this.service?.unregisterResourceServer?.('api');
  }
}

export default PluginIdpOauthServer;
