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
}

export interface ResourceRef {
  type: string;
  id: string;
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
