import type { AccessConstraint } from './constraints.js';
import type { RecordSelection } from './selection.js';
import type { AuthorizationTitle } from './titles.js';
import type {
  AuthorizationIdentity,
  AuthorizationSubject,
  Principal,
  ResourceRef,
} from './types.js';

export interface AuthorizationGrantSource {
  /** Display metadata supplied by the source, never used to determine access. */
  title?: AuthorizationTitle;
  plugin: string;
  id: string;
}

/** Interpreted only by the resource type that owns the grant. */
export interface AuthorizationPolicy {
  type: string;
  [key: string]: unknown;
}

/** A grant as a Permission Set or a builder writes it. */
export interface PermissionGrant {
  resource: ResourceRef;
  actions: readonly PermissionGrantAction[];
}

export interface PermissionGrantAction {
  action: string;
  policy?: AuthorizationPolicy;
}

/** The composite action a composed grant was expanded from. */
export interface AuthorizationGrantOrigin {
  resource: ResourceRef;
  action: string;
  /** The data scope of the composite action this grant fills. */
  scopeKey?: string;
  /** What the composite grant selected for that data scope. */
  selection?: RecordSelection;
  /** Rule constraints that apply to this composite branch only. */
  constraints?: readonly AccessConstraint[];
}

export interface AuthorizationGrant {
  source: AuthorizationGrantSource;
  resource: ResourceRef;
  action: string;
  policy?: AuthorizationPolicy;
  origin?: AuthorizationGrantOrigin;
}

export interface ResolveAuthorizationGrantsInput {
  principal: Principal;
  subjects?: readonly AuthorizationSubject[];
  resource: ResourceRef;
  action: string;
}

export interface ResolveAllAuthorizationGrantsInput {
  principal: Principal;
  subjects?: readonly AuthorizationSubject[];
}

export type AuthorizationGrantsChangedListener = (
  subject: AuthorizationSubject,
) => void | Promise<void>;

/** The Grant Provider contract. */
export interface AuthorizationGrantService {
  resolve(
    input: ResolveAuthorizationGrantsInput,
  ): Promise<readonly AuthorizationGrant[]>;
  resolveAll(
    input: ResolveAllAuthorizationGrantsInput,
  ): Promise<readonly AuthorizationGrant[]>;
  /** A service bound to one identity, sharing reads across its checks. */
  for?(identity: AuthorizationIdentity): AuthorizationGrantService;
  /** Sources already resolved for this identity. Reading them does not load grants. */
  resolvedSources?(): readonly AuthorizationGrantSource[];
  /** True when the identity skips per-resource authorization. */
  unrestricted?(identity: AuthorizationIdentity): Promise<boolean>;
  /** Notifies when the grants a subject resolves to may have changed. */
  onChange?(listener: AuthorizationGrantsChangedListener): () => void;
}
