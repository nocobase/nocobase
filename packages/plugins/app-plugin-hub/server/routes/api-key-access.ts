import type {
  AuthorizationContext,
  AuthorizationEnv,
} from '@nocobase/authorization/core';
import type { Logger } from '@nocobase/logging';
import type { Context, Handler, Hono, MiddlewareHandler, Next } from 'hono';
import { matchedRoutes } from 'hono/route';

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

/** The route shapes a publishing key can reach: every one of them is scoped to a single App. */
export type HubAppRoutePath = `/apps/:appId${'' | `/${string}`}`;

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
  readonly app: Hono<HubRouteEnv>;
  readonly apiKeys: () => HubApiKeyVerifier;
  readonly authorizationFor: (userId: string) => AuthorizationContext;
  readonly securityLogger?: Logger;
}

type Method = 'GET' | 'POST' | 'PUT';

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

/**
 * Registers App routes together with their access rules, so whether a publishing key may call a route is stated
 * once, where the route is defined.
 *
 * Every route registered here authorizes the request before its handler runs: a signed-in user needs the declared
 * `hub.app` action, and a publishing key must satisfy the declared requirement for the App in the path. The
 * boundary middleware asks `acceptsApiKey` which route Hono selected, and rejects a publishing key for every route
 * that did not declare one.
 */
export class HubAppRoutes {
  readonly #options: HubAppRoutesOptions;
  readonly #apiKeyRoutes = new Map<string, HubApiKeyRequirement>();

  constructor(options: HubAppRoutesOptions) {
    this.#options = options;
  }

  get<P extends HubAppRoutePath>(
    path: P,
    access: HubAppRouteAccess,
    handler: Handler<HubRouteEnv, P>,
  ): void {
    this.#options.app.get(path, this.#authorize('GET', path, access), handler);
  }

  post<P extends HubAppRoutePath>(
    path: P,
    access: HubAppRouteAccess,
    handler: Handler<HubRouteEnv, P>,
  ): void {
    this.#options.app.post(
      path,
      this.#authorize('POST', path, access),
      handler,
    );
  }

  put<P extends HubAppRoutePath>(
    path: P,
    access: HubAppRouteAccess,
    handler: Handler<HubRouteEnv, P>,
  ): void {
    this.#options.app.put(path, this.#authorize('PUT', path, access), handler);
  }

  /**
   * Whether the route Hono selected for this request declared a publishing-key requirement.
   *
   * Reads Hono's own match rather than re-matching the path, so the answer is about the route that will run. The
   * route's path is compared without the prefix the Hub routes are mounted under.
   */
  acceptsApiKey(context: Context<HubRouteEnv, string>): boolean {
    const route = matchedRoutes(context).find(
      (candidate) => candidate.method !== 'ALL',
    );
    if (!route) return false;
    const path =
      route.basePath === '/'
        ? route.path
        : route.path.slice(route.basePath.length);
    return this.#apiKeyRoutes.has(`${route.method} ${path}`);
  }

  #authorize(
    method: Method,
    path: HubAppRoutePath,
    access: HubAppRouteAccess,
  ): MiddlewareHandler<HubRouteEnv> {
    const requirement = access.apiKey;
    if (requirement) this.#apiKeyRoutes.set(`${method} ${path}`, requirement);
    return async (context, next: Next) => {
      const appId = context.req.param('appId');
      if (!appId) throw new Error(`Route ${path} has no App parameter.`);
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
      if (!secret || !requirement)
        return context.json(
          {
            error: {
              code: 'API_KEY_FORBIDDEN',
              message: 'This endpoint requires a signed-in user.',
            },
          },
          403,
        );
      try {
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
      } catch (error) {
        if (error instanceof HubError)
          return context.json(
            { error: { code: error.code, message: error.message } },
            error.status,
          );
        throw error;
      }
      return next();
    };
  }
}
