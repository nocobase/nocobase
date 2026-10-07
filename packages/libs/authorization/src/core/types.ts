export interface Principal {
  type: string;
  id: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface AuthorizationSubject {
  type: string;
  id: string;
}

export interface AuthorizationIdentity {
  principal: Principal;
  subjects?: readonly AuthorizationSubject[];
  /**
   * The scope of the credential the request arrived with, such as a scoped API key. It only ever narrows: a check
   * outside it is denied whatever the identity's grants allow.
   */
  keyScope?: KeyScope;
}

export interface ResourceRef {
  type: string;
  id: string;
}

/**
 * What a scoped credential may reach, on top of what its holder's grants allow. The holder's own permissions still
 * apply in full: the effective permission is the intersection, so a scope never grants anything.
 */
export interface KeyScope {
  /** The credential the scope belongs to, for audit and error messages. */
  readonly keyId: string;
  /** Whether the scope covers `action` on `resource`. Checked on the action requested, never on composite internals. */
  allows(resource: ResourceRef, action: string): boolean;
  /**
   * The records of `business` the scope is limited to: `'all'`, or their ids. Only the code that reads the records can
   * enforce this, so a plugin that offers object selection for a business must apply it in its own guards.
   */
  objects(business: string): 'all' | readonly string[];
  /**
   * Every resource action the scope covers, for listing what the holder may do; null when the scope narrows no action
   * (a credential bounded only by its holder, such as an unscoped key of a service account).
   */
  readonly permissions:
    | readonly {
        readonly resource: ResourceRef;
        readonly actions: readonly string[];
      }[]
    | null;
}

/** Whether `identity` may reach `action` on `resource` as far as its credential's scope goes. */
export function keyScopeAllows(
  identity: Pick<AuthorizationIdentity, 'keyScope'>,
  resource: ResourceRef,
  action: string,
): boolean {
  return identity.keyScope?.allows(resource, action) ?? true;
}

export type AuthorizationRequest<TParams = undefined> = {
  principal: Principal;
  subjects?: readonly AuthorizationSubject[];
  resource: ResourceRef;
  action: string;
} & ([TParams] extends [undefined]
  ? { params?: undefined }
  : { params: TParams });

export type AuthorizationEffect = 'permit' | 'conditional' | 'deny';

export interface AuthorizationReason {
  code: string;
  message: string;
  plugin?: string;
  details?: Readonly<Record<string, unknown>>;
}

export interface AuthorizationConditions {
  type: string;
  [key: string]: unknown;
}

export interface AuthorizationDecision<
  TConditions extends AuthorizationConditions = AuthorizationConditions,
> {
  effect: AuthorizationEffect;
  conditions?: TConditions;
  reasons: readonly AuthorizationReason[];
}

/**
 * Thrown by `require`. It answers `403` in the standard API error body, status `PERMISSION_DENIED`, reason
 * `AUTHORIZATION_DENIED` and domain `authorization`, on its own: `getResponse` is the interface Hono's default error
 * handler honours, and an application's `/api` error handler reads `status`, `reason` and `domain`, as request logging
 * reads `status`.
 */
export class AuthorizationDeniedError extends Error {
  readonly decision: AuthorizationDecision;
  readonly status = 403;
  /** The standard API error `reason` and `domain`, read by the application's `/api` error handler. */
  readonly reason = 'AUTHORIZATION_DENIED';
  readonly domain = 'authorization';

  constructor(decision: AuthorizationDecision) {
    super(decision.reasons.at(-1)?.message ?? 'Authorization denied');
    this.name = 'AuthorizationDeniedError';
    this.decision = decision;
  }

  getResponse(): Response {
    return Response.json(
      {
        error: {
          code: this.status,
          status: 'PERMISSION_DENIED',
          reason: this.reason,
          domain: this.domain,
          message: this.message,
        },
      },
      { status: this.status },
    );
  }
}
