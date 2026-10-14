import {
  ParameterConfigurationError,
  type ReviewerSelection,
} from './parameter-configuration.js';
import type { JsonObject, JsonValue } from './types.js';

export interface ReviewerResolverContext {
  readonly scope: string;
  readonly applicantId: string;
  readonly transactionHandle?: unknown;
}
export type ReviewerSelector = (
  referenceId: string,
  context: ReviewerResolverContext,
) => Promise<readonly string[]>;
export interface ReviewerResolverOptions {
  readonly selectors: Readonly<Record<string, ReviewerSelector>>;
  /** Applies uniformly to every candidate, including explicit-user groups. */
  readonly eligible: (
    userId: string,
    context: ReviewerResolverContext,
  ) => Promise<boolean>;
}
export function normalizeReviewerSelections(
  value: unknown,
  allowedTypes: readonly string[],
): JsonValue {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100)
    throw new ParameterConfigurationError(
      'CONFIGURATION_INVALID',
      'A reviewer rule needs between 1 and 100 selections.',
    );
  const result: JsonObject[] = [];
  for (const item of value as unknown[]) {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      throw new ParameterConfigurationError(
        'CONFIGURATION_INVALID',
        'Invalid reviewer selection.',
      );
    const selection = item as Record<string, unknown>;
    if (
      Object.keys(selection).some(
        (key) => !['group', 'type', 'referenceId'].includes(key),
      ) ||
      !Number.isSafeInteger(selection.group) ||
      Number(selection.group) < 1 ||
      typeof selection.type !== 'string' ||
      !allowedTypes.includes(selection.type) ||
      typeof selection.referenceId !== 'string' ||
      !selection.referenceId
    )
      throw new ParameterConfigurationError(
        'CONFIGURATION_INVALID',
        'Reviewer selections require a positive group, an allowed type and a stable reference ID.',
      );
    result.push({
      group: Number(selection.group),
      type: selection.type,
      referenceId: selection.referenceId,
    });
  }
  return result;
}
/** Fixed semantics: intersection within each group, union across groups, then eligibility. */
export async function resolveReviewerSelections(
  selections: readonly ReviewerSelection[],
  context: ReviewerResolverContext,
  options: ReviewerResolverOptions,
): Promise<readonly string[]> {
  const groups = new Map<number, Set<string>>();
  for (const selection of selections) {
    const selector = options.selectors[selection.type];
    if (!selector)
      throw new ParameterConfigurationError(
        'CONFIGURATION_INVALID',
        `Reviewer selector "${selection.type}" is not registered.`,
      );
    const matches = new Set(await selector(selection.referenceId, context));
    const previous = groups.get(selection.group);
    groups.set(
      selection.group,
      previous
        ? new Set([...previous].filter((id) => matches.has(id)))
        : matches,
    );
  }
  const combined = new Set([...groups.values()].flatMap((group) => [...group]));
  const eligible: string[] = [];
  for (const id of [...combined].sort())
    if (await options.eligible(id, context)) eligible.push(id);
  return eligible;
}
