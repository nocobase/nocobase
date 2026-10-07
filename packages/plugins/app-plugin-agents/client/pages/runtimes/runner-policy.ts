import type { RunnerPolicy } from '@nocobase/agent-protocol';

export const POLICY_FIELDS = ['agents', 'subjects', 'repos'] as const;

export type PolicyField = (typeof POLICY_FIELDS)[number];

/**
 * What a runner's owner's local policy says of one kind of work: `any` when it does not limit it, `nothing` when it
 * takes none, otherwise the patterns it accepts. The policy is the runner's own file; the page only shows what the
 * runner reported.
 */
export type PolicyRule =
  | { readonly kind: 'any' }
  | { readonly kind: 'nothing' }
  | { readonly kind: 'only'; readonly patterns: readonly string[] };

export function policyRule(
  policy: RunnerPolicy,
  field: PolicyField,
): PolicyRule {
  const list = policy[field];
  if (list === undefined) return { kind: 'any' };
  if (list.length === 0) return { kind: 'nothing' };
  return { kind: 'only', patterns: list };
}
