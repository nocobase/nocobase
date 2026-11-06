import type { RepositoryPolicy } from '../repository/policy/types.js';

/**
 * Policies keyed by collection, evaluated once for one principal by
 * connection.restrict() or connection.withPolicies().
 */
export type DatabasePolicyMap<
  P,
  TCollection extends string = string,
> = Readonly<
  Record<TCollection, RepositoryPolicy | ((principal: P) => RepositoryPolicy)>
>;
