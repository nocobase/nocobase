import { RepositoryError } from '../errors.js';
import type {
  NormalizedReadNode,
  NormalizedRepositoryPolicy,
  PolicyRef,
} from './types.js';

/**
 * Refer to another Collection's read node from inside `read.relations`.
 *
 * The target names a key of the same `scope` or legacy `withPolicies` map,
 * not a Policy the target Collection owns globally. That is where Collections'
 * Policies share a scope, and it keeps "reached through a relation" and
 * "queried directly" from silently influencing each other: the reuse is
 * written out rather than inherited.
 *
 * It is expanded when the map is bound, not dereferenced per query, so a cycle
 * is a configuration error rather than a stack overflow at request time.
 */
export function ref(target: string): PolicyRef {
  return Object.freeze({ kind: 'policyRef' as const, target });
}

/**
 * Replace every `ref()` in a bound map with the node it names.
 *
 * Only `read.relations` carries references. Relation writes are authorized by
 * the originating side alone — the target's own Policy deliberately does not
 * take part — so there is nothing there to refer to.
 */
export function expandPolicyRefs(
  policies: Readonly<Record<string, NormalizedRepositoryPolicy>>,
): Readonly<Record<string, NormalizedRepositoryPolicy>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(policies).map(([collection, policy]) => [
        collection,
        policy.read === true || policy.read === false
          ? policy
          : Object.freeze({
              ...policy,
              read: expandReadNode(
                policies,
                policy.read,
                [collection],
                [collection, 'read'],
              ),
            }),
      ]),
    ),
  );
}

function expandReadNode(
  policies: Readonly<Record<string, NormalizedRepositoryPolicy>>,
  node: NormalizedReadNode,
  chain: readonly string[],
  path: readonly (string | number)[],
): NormalizedReadNode {
  const relations = Object.fromEntries(
    Object.entries(node.relations).map(([name, child]) => {
      const childPath = [...path, 'relations', name];
      return [
        name,
        'kind' in child
          ? expandReadNode(
              policies,
              resolveRef(policies, child, chain, childPath),
              [...chain, child.target],
              childPath,
            )
          : expandReadNode(policies, child, chain, childPath),
      ];
    }),
  );
  return Object.freeze({ ...node, relations: Object.freeze(relations) });
}

function resolveRef(
  policies: Readonly<Record<string, NormalizedRepositoryPolicy>>,
  reference: PolicyRef,
  chain: readonly string[],
  path: readonly (string | number)[],
): NormalizedReadNode {
  if (chain.includes(reference.target)) {
    throw new RepositoryError(
      'INVALID_POLICY',
      `Policy reference to "${reference.target}" forms a cycle: ${[...chain, reference.target].join(' → ')}.`,
      { path },
    );
  }
  const target = Object.hasOwn(policies, reference.target)
    ? policies[reference.target]
    : undefined;
  if (!target) {
    throw new RepositoryError(
      'INVALID_POLICY',
      `Policy reference to "${reference.target}" names no Collection in this binding. A reference resolves against the same policy map, not a Policy the target owns elsewhere.`,
      { path },
    );
  }
  if (target.read === true || target.read === false) {
    throw new RepositoryError(
      'INVALID_POLICY',
      `Policy reference to "${reference.target}" cannot expand: its read node is ${String(target.read)} rather than a set of rules, and a relation needs the fields and relations it is allowed to expand.`,
      { path },
    );
  }
  return target.read;
}
