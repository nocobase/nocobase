import type { MiddlewareHandler } from 'hono';
import {
  COMPOSITE_RESOURCE_TYPE,
  CompositeResourceRegistry,
  composedGrants,
  type CompositeResourceApi,
  type CompositeResourceCheck,
  type CompositeResourceConditions,
  type InvalidGrant,
} from './composite.js';
import {
  AccessConstraintRegistry,
  type AccessConstraintService,
} from './constraints.js';
import type {
  AuthorizationGrantService,
  AuthorizationGrantsChangedListener,
} from './grants.js';
import {
  createAuthorizationMiddlewareRequest,
  runAuthorizationMiddlewares,
  type AuthorizationMiddleware,
} from './middleware.js';
import {
  sortAuthorizationPlugins,
  type AuthorizationPlugin,
  type AuthorizationPluginApis,
} from './plugin.js';
import { RecordAccessRegistry } from './record-access.js';
import { ResourceTypeRegistry, resourceTypeHandler } from './resource-types.js';
import { AuthorizationRouteRegistry } from './routes.js';
import { AuthorizationSubjectRegistry } from './subjects.js';
import {
  AuthorizationDeniedError,
  type AuthorizationDecision,
  type AuthorizationIdentity,
  type AuthorizationRequest,
  type KeyScope,
  type ResourceRef,
} from './types.js';

/** A request made through an `AuthorizationContext`, which supplies the identity. */
export type AuthorizationCheckRequest<TParams = undefined> = Omit<
  AuthorizationRequest<TParams>,
  'principal' | 'subjects'
>;

export interface AuthorizationPermission {
  resource: ResourceRef;
  actions: readonly string[];
}

/** What the client may show. Never an executable data policy. */
export interface AuthorizationSnapshot {
  /** True when every action is permitted; `permissions` is then empty. */
  readonly unrestricted: boolean;
  readonly permissions: readonly AuthorizationPermission[];
}

/** Checks for one identity, sharing grant and rule reads between them. */
export interface AuthorizationContext {
  readonly identity: AuthorizationIdentity;
  authorize(
    request: Omit<AuthorizationCheckRequest, 'resource'> & {
      resource: { type: 'composite'; id: string };
    },
  ): Promise<AuthorizationDecision<CompositeResourceConditions>>;
  authorize<TParams = undefined>(
    request: AuthorizationCheckRequest<TParams>,
  ): Promise<AuthorizationDecision>;
  /** True only for `permit`; a conditional decision counts as false. */
  can<TParams = undefined>(
    request: AuthorizationCheckRequest<TParams>,
  ): Promise<boolean>;
  /** Throws `AuthorizationDeniedError` unless the decision is `permit`. */
  require<TParams = undefined>(
    request: AuthorizationCheckRequest<TParams>,
  ): Promise<void>;
  snapshot(): Promise<AuthorizationSnapshot>;
}

export interface AuthorizationEnv {
  Variables: { authz: AuthorizationContext };
}

export interface CreateAuthorizationOptions<
  TPlugins extends readonly AuthorizationPlugin[],
  TConnection = unknown,
> {
  /** Passed through to every plugin's setup; the library never inspects it. */
  connection?: TConnection;
  plugins: TPlugins;
  /**
   * Called once per distinct stored composite grant that no longer expands
   * against the current definitions. The grant is skipped, so it permits
   * nothing while the identity's other grants keep working.
   */
  onInvalidGrant?: (grant: InvalidGrant) => void;
}

interface AuthorizationOptions {
  connection?: unknown;
  plugins: readonly AuthorizationPlugin[];
  onInvalidGrant?: (grant: InvalidGrant) => void;
}

export class Authorization {
  readonly resourceTypes: ResourceTypeRegistry = new ResourceTypeRegistry();
  /** Built in: composites and the reserved `composite` resource type. */
  readonly compositeResources: CompositeResourceApi;
  readonly recordAccess: RecordAccessRegistry = new RecordAccessRegistry();
  readonly constraints: AccessConstraintRegistry =
    new AccessConstraintRegistry();
  readonly subjects: AuthorizationSubjectRegistry =
    new AuthorizationSubjectRegistry();
  readonly routes: AuthorizationRouteRegistry =
    new AuthorizationRouteRegistry();
  private readonly plugins: readonly AuthorizationPlugin[];
  private readonly provider: AuthorizationGrantService;
  private readonly compositeResourceRegistry: CompositeResourceRegistry;
  private readonly middlewares: AuthorizationMiddleware[] = [];

  constructor(options: AuthorizationOptions) {
    this.plugins = sortAuthorizationPlugins(options.plugins);
    const grantProvider = this.plugins.find((plugin) => plugin.grants);
    this.provider = grantProvider?.grants ?? missingGrantService();
    this.compositeResourceRegistry = new CompositeResourceRegistry(
      this.resourceTypes,
      options.onInvalidGrant,
    );
    this.compositeResources = this.compositeResourceRegistry;
    this.installApis();
    const apis: Record<string, unknown> = {};
    for (const plugin of this.plugins)
      Object.assign(apis, plugin.authorizationApi);
    for (const plugin of this.plugins) {
      plugin.setup?.({
        ...apis,
        ...(options.connection === undefined
          ? {}
          : { connection: options.connection }),
        get grants(): AuthorizationGrantService {
          if (!grantProvider?.grants) {
            throw new Error(
              `Authorization plugin "${plugin.id}" accessed grants without a Grant Provider`,
            );
          }
          return grantProvider.grants;
        },
        resourceTypes: this.resourceTypes,
        compositeResources: this.compositeResources,
        recordAccess: this.recordAccess,
        constraints: this.constraints,
        subjects: this.subjects,
        routes: this.routes,
        use: (middleware): void => {
          this.use(middleware);
        },
        middleware: (): MiddlewareHandler<AuthorizationEnv> =>
          this.middleware(),
      });
    }
  }

  /** Adds a step that resolves the request's principal and subjects. */
  use(middleware: AuthorizationMiddleware): void {
    this.middlewares.push(middleware);
  }

  /** Runs every identity step, then sets `authz` to the request's context. */
  middleware(): MiddlewareHandler<AuthorizationEnv> {
    return async (http, next) => {
      const request = createAuthorizationMiddlewareRequest(http);
      await runAuthorizationMiddlewares(this.middlewares, request, async () => {
        if (!request.principal) {
          throw new Error('Authorization principal was not resolved');
        }
        http.set(
          'authz',
          this.for({
            principal: request.principal,
            subjects: request.subjects.values(),
            ...(request.keyScope ? { keyScope: request.keyScope } : {}),
          }),
        );
        await next();
      });
    };
  }

  /** Subscribes to the Grant Provider's change announcements. */
  onGrantsChanged(listener: AuthorizationGrantsChangedListener): () => void {
    return this.provider.onChange?.(listener) ?? ((): void => {});
  }

  for(identity: AuthorizationIdentity): AuthorizationContext {
    const constraints = this.constraints.for(identity);
    const grants = composedGrants(
      this.provider.for?.(identity) ?? this.provider,
      this.compositeResourceRegistry,
      constraints,
    );
    const request = <TParams>(
      input: AuthorizationCheckRequest<TParams>,
    ): AuthorizationRequest<TParams> =>
      ({
        ...input,
        principal: identity.principal,
        ...(identity.subjects === undefined
          ? {}
          : { subjects: identity.subjects }),
      }) as AuthorizationRequest<TParams>;
    // A scoped credential is checked on the action requested only: the grants a composite action expands into are
    // the composite's business, so its internal checks run unscoped.
    const outOfScope = (input: AuthorizationCheckRequest<unknown>) =>
      identity.keyScope &&
      !identity.keyScope.allows(input.resource, input.action)
        ? keyScopeDenial(identity.keyScope, input.resource, input.action)
        : undefined;
    const authorize = async <TParams>(
      input: AuthorizationCheckRequest<TParams>,
    ): Promise<AuthorizationDecision> =>
      outOfScope(input) ??
      (await this.authorizeWithGrants(request(input), grants, constraints));
    return {
      identity,
      authorize: authorize as AuthorizationContext['authorize'],
      can: async (input) =>
        !outOfScope(input) &&
        (
          await this.authorizeWithGrants(
            request(input),
            grants,
            constraints,
            false,
          )
        ).effect === 'permit',
      require: async (input) => {
        const decision = await authorize(input);
        if (decision.effect !== 'permit') {
          throw new AuthorizationDeniedError(decision);
        }
      },
      snapshot: async () => {
        const unscoped = await this.snapshot(identity, grants, constraints);
        return identity.keyScope
          ? await this.scopedSnapshot(
              identity,
              identity.keyScope,
              unscoped,
              grants,
              constraints,
            )
          : unscoped;
      },
    };
  }

  /**
   * The snapshot of a scoped identity: what it could do without the scope, kept to what the scope covers. A scope
   * that lists its actions is checked action by action, so a holder of everything sees exactly the scope.
   */
  private async scopedSnapshot(
    identity: AuthorizationIdentity,
    scope: KeyScope,
    unscoped: AuthorizationSnapshot,
    grants: AuthorizationGrantService,
    constraints: AccessConstraintService,
  ): Promise<AuthorizationSnapshot> {
    if (scope.permissions === null) {
      if (unscoped.unrestricted) return unscoped;
      return {
        unrestricted: false,
        permissions: unscoped.permissions
          .map((permission) => ({
            resource: permission.resource,
            actions: permission.actions.filter((action) =>
              scope.allows(permission.resource, action),
            ),
          }))
          .filter((permission) => permission.actions.length > 0),
      };
    }
    const checked = await Promise.all(
      scope.permissions.map(async (permission) => ({
        resource: { ...permission.resource },
        actions: (
          await Promise.all(
            permission.actions.map(async (action) =>
              scope.allows(permission.resource, action) &&
              (
                await this.authorizeWithGrants<undefined>(
                  { ...identity, resource: permission.resource, action },
                  grants,
                  constraints,
                  false,
                )
              ).effect === 'permit'
                ? action
                : null,
            ),
          )
        )
          .filter((action): action is string => action !== null)
          .sort(),
      })),
    );
    const grouped = new Map<string, AuthorizationPermission>();
    for (const permission of checked) {
      if (permission.actions.length === 0) continue;
      const key = JSON.stringify([
        permission.resource.type,
        permission.resource.id,
      ]);
      const existing = grouped.get(key);
      grouped.set(key, {
        resource: permission.resource,
        actions: [
          ...new Set([...(existing?.actions ?? []), ...permission.actions]),
        ].sort(),
      });
    }
    return {
      unrestricted: false,
      permissions: [...grouped.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, permission]) => permission),
    };
  }

  private async authorizeWithGrants<TParams>(
    request: AuthorizationRequest<TParams>,
    grants: AuthorizationGrantService,
    constraints: AccessConstraintService,
    resolveConditions = true,
  ): Promise<AuthorizationDecision> {
    const handler = resourceTypeHandler(
      this.resourceTypes,
      request.resource.type,
    );
    if (!handler) {
      return deny(
        'UNKNOWN_RESOURCE_TYPE',
        `No resource type "${request.resource.type}" is registered`,
      );
    }
    const stored = request as AuthorizationRequest<unknown>;
    try {
      const unrestricted =
        (await grants.unrestricted?.({
          principal: request.principal,
          ...(request.subjects === undefined
            ? {}
            : { subjects: request.subjects }),
        })) === true;
      const decision = unrestricted
        ? await handler.authorizeUnrestricted(stored)
        : await handler.authorize(stored, { grants, constraints });
      if (
        decision.effect === 'conditional' &&
        decision.conditions === undefined
      ) {
        return deny(
          'INVALID_CONDITIONAL_DECISION',
          `Resource type "${handler.type}" returned a conditional decision without conditions`,
        );
      }
      if (
        !resolveConditions ||
        decision.effect === 'deny' ||
        request.resource.type !== COMPOSITE_RESOURCE_TYPE
      )
        return decision;
      return await this.composeComposite(stored, decision, grants, constraints);
    } catch (error) {
      return deny(
        'AUTHORIZATION_HANDLER_FAILED',
        error instanceof Error ? error.message : 'Authorization handler failed',
      );
    }
  }

  /** Checks each grant target a composite action composes, with its grants only. */
  private async composeComposite(
    request: AuthorizationRequest<unknown>,
    decision: AuthorizationDecision,
    grants: AuthorizationGrantService,
    constraints: AccessConstraintService,
  ): Promise<AuthorizationDecision> {
    const action = this.compositeResourceRegistry.getAction(
      request.resource.id,
      request.action,
    );
    if (!action) return decision;
    const fromThisAction = (
      grant: Awaited<ReturnType<AuthorizationGrantService['resolve']>>[number],
    ): boolean =>
      grant.origin?.resource.type === COMPOSITE_RESOURCE_TYPE &&
      grant.origin.resource.id === request.resource.id &&
      grant.origin.action === request.action;
    const scoped: AuthorizationGrantService = {
      ...grants,
      resolveAll: async (input) =>
        (await grants.resolveAll(input)).filter(fromThisAction),
      resolve: async (input) =>
        (await grants.resolve(input)).filter(fromThisAction),
    };
    const targets = new Map<
      string,
      { resource: ResourceRef; action: string }
    >();
    for (const grant of action.grants)
      for (const entry of grant.actions)
        targets.set(JSON.stringify([grant.resource, entry.action]), {
          resource: grant.resource,
          action: entry.action,
        });
    const checks: CompositeResourceCheck[] = await Promise.all(
      [...targets.values()].map(async (target) => ({
        ...target,
        decision: await this.authorizeWithGrants(
          {
            principal: request.principal,
            ...(request.subjects === undefined
              ? {}
              : { subjects: request.subjects }),
            ...target,
            params: {
              operation: {
                resource: request.resource.id,
                action: request.action,
              },
            },
          },
          scoped,
          constraints,
        ),
      })),
    );
    const conditions: CompositeResourceConditions = {
      type: 'composite',
      checks,
    };
    for (const plugin of this.plugins)
      Object.assign(conditions, plugin.composeConditions?.(checks));
    // A denied underlying check becomes a policy that reaches no records.
    return {
      effect: checks.every((check) => check.decision.effect === 'permit')
        ? 'permit'
        : 'conditional',
      conditions,
      reasons: [
        ...decision.reasons,
        ...checks.flatMap((check) => check.decision.reasons),
      ],
    };
  }

  /**
   * Lists exactly the (type, id, action) triples `can()` permits among the
   * identity's expanded grants, so the client never shows what the server
   * refuses.
   */
  private async snapshot(
    identity: AuthorizationIdentity,
    grants: AuthorizationGrantService,
    constraints: AccessConstraintService,
  ): Promise<AuthorizationSnapshot> {
    if ((await grants.unrestricted?.(identity)) === true)
      return { unrestricted: true, permissions: [] };
    const candidates = new Map<
      string,
      { resource: ResourceRef; action: string }
    >();
    for (const grant of await grants.resolveAll(identity))
      candidates.set(
        JSON.stringify([grant.resource.type, grant.resource.id, grant.action]),
        {
          resource: { type: grant.resource.type, id: grant.resource.id },
          action: grant.action,
        },
      );
    const permitted = await Promise.all(
      [...candidates.values()].map(async (candidate) => ({
        candidate,
        permitted:
          (
            await this.authorizeWithGrants<undefined>(
              { ...identity, ...candidate },
              grants,
              constraints,
              false,
            )
          ).effect === 'permit',
      })),
    );
    const grouped = new Map<
      string,
      { resource: ResourceRef; actions: Set<string> }
    >();
    for (const { candidate, permitted: allowed } of permitted) {
      if (!allowed) continue;
      const key = JSON.stringify([
        candidate.resource.type,
        candidate.resource.id,
      ]);
      const permission = grouped.get(key) ?? {
        resource: candidate.resource,
        actions: new Set<string>(),
      };
      permission.actions.add(candidate.action);
      grouped.set(key, permission);
    }
    return {
      unrestricted: false,
      permissions: [...grouped.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([, permission]) => ({
          resource: permission.resource,
          actions: [...permission.actions].sort(),
        })),
    };
  }

  private installApis(): void {
    for (const plugin of this.plugins) {
      for (const [name, api] of Object.entries(plugin.authorizationApi ?? {})) {
        if (name in this) {
          throw new Error(
            `Authorization API already registered: ${name} (plugin: ${plugin.id})`,
          );
        }
        Object.defineProperty(this, name, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: api,
        });
      }
    }
  }
}

/** The decision for a check outside the credential's scope: denied before any grant is read. */
function keyScopeDenial(
  scope: KeyScope,
  resource: ResourceRef,
  action: string,
): AuthorizationDecision {
  return deny(
    'KEY_SCOPE',
    `The credential ${scope.keyId} is not scoped to ${resource.type}:${resource.id}.${action}`,
  );
}

function deny(code: string, message: string): AuthorizationDecision {
  return { effect: 'deny', reasons: [{ code, message }] };
}

function missingGrantService(): AuthorizationGrantService {
  return {
    resolve(): Promise<never> {
      return Promise.reject(new Error('Authorization has no Grant Provider'));
    },
    resolveAll(): Promise<never> {
      return Promise.reject(new Error('Authorization has no Grant Provider'));
    },
  };
}

export function createAuthorization<
  const TPlugins extends readonly AuthorizationPlugin[],
  TConnection = unknown,
>(
  options: CreateAuthorizationOptions<TPlugins, TConnection>,
): Authorization & AuthorizationPluginApis<TPlugins> {
  return new Authorization(options) as Authorization &
    AuthorizationPluginApis<TPlugins>;
}
