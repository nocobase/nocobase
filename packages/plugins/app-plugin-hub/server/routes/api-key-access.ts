import type {
  AuthorizationContext,
  AuthorizationEnv,
} from '@nocobase/authorization/core';
import type { Logger } from '@nocobase/logging';
import type { Context, MiddlewareHandler, Next } from 'hono';
import { matchedRoutes } from 'hono/route';
import { COMPOSED_HANDLER } from 'hono/utils/constants';

import {
  HUB_API_KEY_SCOPES,
  type HubApiKeyScope,
} from '../../shared/api-keys.js';
import { HubError } from '../services/hub.js';

/**
 * What a route asks of a publishing key: one scope, or `any` for a read that every publishing key bound to the App
 * may make. `any` still checks the key creator's current permission for the scope it is granted under.
 */
export type HubApiKeyRequirement = HubApiKeyScope | 'any';

/** The Hono environment of the Hub routes. */
export type HubRouteEnv = AuthorizationEnv;

/** Access to one App route, declared with the route itself. */
export interface HubAppRouteAccess {
  /** The `hub.app` action a signed-in user needs. */
  readonly action: string;
  /** The publishing-key requirement; omit it to keep the route closed to publishing keys. */
  readonly apiKey?: HubApiKeyRequirement;
}

export interface HubApiKeyVerifier {
  verify(
    secret: string,
    appId: string,
    scopes: HubApiKeyScope | readonly HubApiKeyScope[],
  ): Promise<{
    readonly id: string;
    readonly createdBy: string;
    readonly scope: HubApiKeyScope;
  }>;
}

export interface HubAppRoutesOptions {
  readonly apiKeys: () => HubApiKeyVerifier;
  readonly authorizationFor: (userId: string) => AuthorizationContext;
  readonly securityLogger?: Logger;
}

const PUBLISHING_KEY_PATTERN = /^Bearer (hub_app_[A-Za-z0-9_-]+)$/i;

/** The publishing key in an `Authorization` header, or `undefined` when the header does not carry one. */
export function publishingKeySecret(credential: string): string | undefined {
  return PUBLISHING_KEY_PATTERN.exec(credential)?.[1];
}

/** The scopes a requirement can be satisfied by, in the order they are tried. */
export function apiKeyScopes(
  requirement: HubApiKeyRequirement,
): readonly HubApiKeyScope[] {
  return requirement === 'any' ? HUB_API_KEY_SCOPES : [requirement];
}

/** A publishing key the Hub boundary refused before any route ran. */
export function apiKeyForbidden(): HubError {
  return new HubError(
    'This endpoint requires a signed-in user.',
    'API_KEY_FORBIDDEN',
    'PERMISSION_DENIED',
  );
}

/**
 * Authorizes App routes, so whether a publishing key may call a route is stated once, where the route is defined.
 *
 * `access()` makes the first middleware of an App route: a signed-in user needs the declared `hub.app` action, and a
 * publishing key must satisfy the declared requirement for the App in the path. The boundary middleware asks
 * `acceptsApiKey` whether the route Hono selected starts with such a middleware, and rejects a publishing key for
 * every route that does not.
 */
export class HubAppRoutes {
  readonly #options: HubAppRoutesOptions;
  /** The middleware `access()` made for routes that accept a publishing key. */
  readonly #apiKeyMiddleware = new WeakSet<object>();

  constructor(options: HubAppRoutesOptions) {
    this.#options = options;
  }

  /**
   * Whether the route Hono selected for this request declared a publishing-key requirement.
   *
   * Reads Hono's own match rather than re-matching the path, so the answer is about the route that will run: the
   * first handler of that route is the middleware `access()` made for it. Mounting a router wraps each handler, and
   * Hono keeps the one it wrapped under `COMPOSED_HANDLER`.
   */
  acceptsApiKey(context: Context<HubRouteEnv, string>): boolean {
    const route = matchedRoutes(context).find(
      (candidate) => candidate.method !== 'ALL',
    );
    let handler: unknown = route?.handler;
    while (typeof handler === 'function') {
      if (this.#apiKeyMiddleware.has(handler)) return true;
      handler = (handler as unknown as Record<string, unknown>)[
        COMPOSED_HANDLER
      ];
    }
    return false;
  }

  /** The authorization middleware an App route starts with. */
  access(access: HubAppRouteAccess): MiddlewareHandler<HubRouteEnv> {
    const requirement = access.apiKey;
    const middleware: MiddlewareHandler<HubRouteEnv> = async (
      context,
      next: Next,
    ) => {
      const appId = context.req.param('appId');
      if (!appId) throw new Error('An App route has no App parameter.');
      const credential = context.req.header('authorization');
      if (!credential) {
        await context.get('authz').require({
          resource: { type: 'hub.app', id: appId },
          action: access.action,
        });
        return next();
      }
      const secret = publishingKeySecret(credential);
      // The boundary middleware already rejected these; this keeps the route closed if it is ever bypassed.
      if (!secret || !requirement) throw apiKeyForbidden();
      const key = await this.#options
        .apiKeys()
        .verify(secret, appId, apiKeyScopes(requirement));
      context.set('authz', this.#options.authorizationFor(key.createdBy));
      this.#options.securityLogger?.info(
        {
          event: 'hub.api-key.use',
          keyId: key.id,
          actorId: key.createdBy,
          appId,
          scope: key.scope,
        },
        'hub.api-key.use',
      );
      return next();
    };
    if (requirement) this.#apiKeyMiddleware.add(middleware);
    return middleware;
  }
}
