/**
 * What a new definition changes in a workflow's status rules, for the editor to show before it saves: rules added and
 * removed per status (a changed rule is one removed and one added), each in a sentence, and the rules that wake
 * someone on entering their status without anybody confirming it, which the editor points out. Pure.
 *
 * Each rule is described by its type (`StatusRuleType.describe`, the built-in types' included), and a rule whose type
 * is gone is listed as unavailable.
 */
import type {
  WorkflowDefinition,
  WorkflowPreview,
  WorkflowRuleChange,
  WorkflowStatusRule,
} from '../../../shared/workflows.js';
import type { StatusRuleDescription, StatusRuleTypes } from './rule-types.js';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** A rule in a sentence, or null when its type is unavailable. */
export function describeRule(
  rule: WorkflowStatusRule,
  types: StatusRuleTypes | undefined,
): StatusRuleDescription | null {
  const type = types?.get(rule.type);
  if (!type) return null;
  const config = ('config' in rule ? rule.config : undefined) ?? {};
  return (
    type.describe?.(config) ?? {
      summary: `Runs the ${rule.type} rule.`,
    }
  );
}

/** Rules of `a` not matched one for one in `b`. */
function missingFrom(
  a: readonly WorkflowStatusRule[],
  b: readonly WorkflowStatusRule[],
): WorkflowStatusRule[] {
  const pool = b.map(canonical);
  const missing: WorkflowStatusRule[] = [];
  for (const rule of a) {
    const index = pool.indexOf(canonical(rule));
    if (index >= 0) pool.splice(index, 1);
    else missing.push(rule);
  }
  return missing;
}

const rulesByStatus = (definition: WorkflowDefinition) =>
  new Map(definition.states.map((state) => [state.key, state.rules ?? []]));

export function previewRules(
  base: WorkflowDefinition,
  next: WorkflowDefinition,
  types: StatusRuleTypes | undefined,
): WorkflowPreview {
  const before = rulesByStatus(base);
  const after = rulesByStatus(next);
  const keys = [
    ...next.states.map((state) => state.key),
    ...base.states.map((state) => state.key).filter((key) => !after.has(key)),
  ];
  const change = (
    statusKey: string,
    kind: WorkflowRuleChange['change'],
    rule: WorkflowStatusRule,
  ): WorkflowRuleChange => {
    const described = describeRule(rule, types);
    return {
      statusKey,
      change: kind,
      rule,
      available: described !== null,
      summary: described?.summary ?? null,
      attention: described?.attention ?? false,
    };
  };
  const rules = keys.flatMap((statusKey) => {
    const old = before.get(statusKey) ?? [];
    const now = after.get(statusKey) ?? [];
    return [
      ...missingFrom(old, now).map((rule) =>
        change(statusKey, 'removed', rule),
      ),
      ...missingFrom(now, old).map((rule) => change(statusKey, 'added', rule)),
    ];
  });
  const attention = next.states.flatMap((state) =>
    (state.rules ?? []).flatMap((rule) => {
      const described = describeRule(rule, types);
      if (!described?.attention) return [];
      const had = (before.get(state.key) ?? []).some(
        (old) => canonical(old) === canonical(rule),
      );
      return [
        {
          statusKey: state.key,
          rule,
          summary: described.summary,
          isNew: !had,
        },
      ];
    }),
  );
  return { rules, attention };
}
