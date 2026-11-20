import type { AuthorizationGrantSource } from './grants.js';
import type { RecordSelection } from './selection.js';
import type {
  AuthorizationIdentity,
  AuthorizationSubject,
  Principal,
  ResourceRef,
} from './types.js';

/** One action of a default-access, sharing or restriction rule. */
export interface RuleAction {
  action: string;
  /** The composite action's data scope; omit for a rule on the resource itself. */
  scopeKey?: string;
  selection: RecordSelection;
}

/** A rule's contribution to the records one action reaches. */
export interface AccessConstraint {
  source: AuthorizationGrantSource;
  /** `expand` adds records to a grant; `restrict` intersects them. */
  effect: 'expand' | 'restrict';
  selection: RecordSelection;
}

export interface ResolveAccessConstraintsInput {
  /** The composite action's data scope, when the check fills one. */
  scopeKey?: string;
  principal: Principal;
  subjects?: readonly AuthorizationSubject[];
  resource: ResourceRef;
  action: string;
}

export interface AccessConstraintResolver<TTransaction = unknown> {
  id: string;
  /** True for resolvers that do not read transactional state. */
  readonly transactionIndependent?: true;
  /** Binds reads to the caller's transaction before the identity cache is created. */
  withTransaction?(transaction: TTransaction): AccessConstraintResolver;
  /** A resolver bound to one identity, shared by all of its checks. */
  for?(identity: AuthorizationIdentity): AccessConstraintResolver;
  resolve(
    input: ResolveAccessConstraintsInput,
  ): Promise<readonly AccessConstraint[]>;
}

export interface AccessConstraintService {
  resolve(
    input: ResolveAccessConstraintsInput,
  ): Promise<readonly AccessConstraint[]>;
}

export class AccessConstraintRegistry implements AccessConstraintService {
  private readonly resolvers = new Map<string, AccessConstraintResolver>();

  add(resolver: AccessConstraintResolver): void {
    if (this.resolvers.has(resolver.id)) {
      throw new Error(
        `Authorization constraint resolver already registered: ${resolver.id}`,
      );
    }
    this.resolvers.set(resolver.id, resolver);
  }

  async resolve(
    input: ResolveAccessConstraintsInput,
  ): Promise<readonly AccessConstraint[]> {
    const resolved = await Promise.all(
      [...this.resolvers.values()].map((resolver) => resolver.resolve(input)),
    );
    return resolved.flat();
  }

  list(): readonly string[] {
    return [...this.resolvers.keys()].sort();
  }

  /** Caches each answer for the lifetime of one identity's context. */
  for(
    identity: AuthorizationIdentity,
    transaction?: unknown,
  ): AccessConstraintService {
    const cache = new Map<string, Promise<readonly AccessConstraint[]>>();
    const resolvers = [...this.resolvers.values()].map((resolver) => {
      let source = resolver;
      if (transaction !== undefined) {
        if (resolver.withTransaction) {
          source = resolver.withTransaction(transaction);
        } else if (!resolver.transactionIndependent) {
          throw new TypeError(
            `Authorization constraint resolver "${resolver.id}" does not support transactions`,
          );
        }
      }
      return source.for?.(identity) ?? source;
    });
    return {
      resolve: (input) => {
        const key = JSON.stringify([
          input.resource.type,
          input.resource.id,
          input.action,
          input.scopeKey ?? null,
        ]);
        let result = cache.get(key);
        if (!result) {
          result = Promise.all(
            resolvers.map((resolver) =>
              resolver.resolve({
                ...input,
                principal: identity.principal,
                subjects: identity.subjects,
              }),
            ),
          ).then((results) => results.flat());
          cache.set(key, result);
        }
        return result;
      },
    };
  }
}
