import type {
  AuthorizationDecision,
  AuthorizationOptionsResponse,
  AuthorizationSubject,
  LocalizedText,
} from '../authorization-client.js';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import type { DataRuleKind } from './data-rule-kinds.js';
import type { DataRule } from './default-access-model.js';

/** A resource the inspector can decide on, with the actions it declares. */
export interface CheckResource {
  readonly type: string;
  readonly id: string;
  readonly title: LocalizedText;
  readonly section: LocalizedText;
  readonly actions: readonly {
    readonly name: string;
    readonly title: LocalizedText;
  }[];
}

export const checkResourceKey = (resource: {
  readonly type: string;
  readonly id: string;
}): string => `${resource.type}:${resource.id}`;

/** Every resource of the inspector's catalog with at least one action, then each data table, once each. */
export function checkResources(
  catalog: AuthorizationOptionsResponse,
): readonly CheckResource[] {
  const seen = new Set<string>();
  const resources: CheckResource[] = [];
  for (const section of catalog.sections)
    for (const sub of section.subsections)
      for (const resource of sub.resources) {
        const key = checkResourceKey(resource);
        if (seen.has(key) || !resource.actions.length) continue;
        seen.add(key);
        resources.push({
          type: resource.type,
          id: resource.id,
          title: resource.title,
          section: section.title,
          actions: resource.actions.map(({ name, title }) => ({ name, title })),
        });
      }
  for (const collection of catalog.collections) {
    const key = checkResourceKey({
      type: 'database.collection',
      id: collection.name,
    });
    if (seen.has(key)) continue;
    seen.add(key);
    resources.push({
      type: 'database.collection',
      id: collection.name,
      title: collection.title ?? collection.name,
      section: {
        key: 'settings.permissionCheck.tables',
        ns: AUTHORIZATION_NAMESPACE,
      },
      actions: ['read', 'create', 'update', 'delete'].map((name) => ({
        name,
        title: { key: `options.actions.${name}`, ns: AUTHORIZATION_NAMESPACE },
      })),
    });
  }
  return resources;
}

/**
 * The sources of the grants a decision matched, each once: `{ plugin: 'permission-sets', id }` names a role. A role
 * that matches through several grants, such as a page and an action, is still one source.
 */
export function matchedSources(
  decision: AuthorizationDecision,
): readonly { readonly plugin: string; readonly id: string }[] {
  const seen = new Set<string>();
  return decision.reasons.flatMap((reason) => {
    if (reason.code !== 'GRANT_MATCHED') return [];
    const source: unknown = reason.details?.source;
    if (!source || typeof source !== 'object') return [];
    const plugin: unknown = Reflect.get(source, 'plugin');
    const id: unknown = Reflect.get(source, 'id');
    if (typeof plugin !== 'string' || typeof id !== 'string') return [];
    const key = `${plugin}:${id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ plugin, id }];
  });
}

/**
 * The rules of one kind that take part in a decision: the rule names the resource and the action, and, for a rule that
 * names people, one of the people is the checked user or a subject the user inherits.
 */
export function matchingRules(
  kind: DataRuleKind,
  rules: readonly DataRule[],
  resource: { readonly type: string; readonly id: string },
  action: string,
  holders: readonly AuthorizationSubject[],
): readonly DataRule[] {
  const held = new Set(
    holders.map((subject) => `${subject.type}:${subject.id}`),
  );
  return rules.filter(
    (rule) =>
      rule.resource.type === resource.type &&
      (rule.resource.id === '*' || rule.resource.id === resource.id) &&
      rule.actions.some((entry) => entry.action === action) &&
      (!kind.subjects ||
        (rule.subjects ?? []).some((subject) =>
          held.has(`${subject.type}:${subject.id}`),
        )),
  );
}

/** What a conditional decision limits one data table to, as the inspector explains it. */
export interface ScopeDetail {
  /** The data table's name. */
  readonly collection: string;
  /** Each source's record selection, such as a role's "Own records". */
  readonly selections: readonly {
    readonly source: { readonly plugin: string; readonly id: string };
    readonly selection: {
      readonly type: string;
      readonly key?: string;
      readonly ids?: readonly unknown[];
    };
  }[];
  /** The records reached, as the conditions the scope resolves to, such as `ownerId = "u1"`. */
  readonly conditions?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const OPERATORS: Readonly<Record<string, string>> = {
  $eq: '=',
  $ne: '≠',
  $gt: '>',
  $gte: '≥',
  $lt: '<',
  $lte: '≤',
  $in: 'in',
  $notIn: 'not in',
};

/**
 * A data scope's filter tree in one line, such as `ownerId = "u1" or teamId in ["t1"]`. Comparisons read as symbols;
 * another operator reads as its name in `operatorNames` (the filter editor's, such as "Is empty"), and an operator
 * that takes no value, such as `$empty`, shows none.
 */
export function describeScopeFilter(
  node: unknown,
  operatorNames: Readonly<Record<string, string>> = {},
): string {
  const describe = (item: unknown, nested: boolean): string => {
    if (!isRecord(item)) return '';
    if (item.kind === 'condition') {
      const path = Array.isArray(item.path) ? item.path.join('.') : '';
      const operator = String(item.operator);
      const name = OPERATORS[operator] ?? operatorNames[operator] ?? operator;
      return item.value === undefined
        ? `${path} ${name}`
        : `${path} ${name} ${JSON.stringify(item.value)}`;
    }
    if (item.kind === 'group' && Array.isArray(item.items)) {
      const parts = item.items
        .map((child) => describe(child, true))
        .filter(Boolean);
      const joined = parts.join(item.logic === 'or' ? ' or ' : ' and ');
      return nested && parts.length > 1 ? `(${joined})` : joined;
    }
    return '';
  };
  return describe(node, false);
}

/** The data tables a conditional decision limits and how, for each check on a data table it is made of. */
export function scopeDetails(
  decision: AuthorizationDecision,
  operatorNames: Readonly<Record<string, string>> = {},
): readonly ScopeDetail[] {
  const conditions = decision.conditions;
  const checks: readonly {
    resource: { type: string; id: string };
    decision: AuthorizationDecision;
  }[] =
    conditions?.type === 'composite' && Array.isArray(conditions.checks)
      ? (conditions.checks as readonly {
          resource: { type: string; id: string };
          decision: AuthorizationDecision;
        }[])
      : conditions?.type === 'database' &&
          typeof conditions.collection === 'string'
        ? [
            {
              resource: {
                type: 'database.collection',
                id: conditions.collection,
              },
              decision,
            },
          ]
        : [];
  return checks
    .filter((check) => check.decision.effect === 'conditional')
    .map((check) => {
      const selections = check.decision.reasons.flatMap((reason) => {
        if (reason.code !== 'SELECTION_EXPANDED') return [];
        const source: unknown = reason.details?.source;
        const selection: unknown = reason.details?.selection;
        if (
          !isRecord(source) ||
          typeof source.plugin !== 'string' ||
          typeof source.id !== 'string' ||
          !isRecord(selection) ||
          typeof selection.type !== 'string'
        )
          return [];
        return [
          {
            source: { plugin: source.plugin, id: source.id },
            selection: {
              type: selection.type,
              ...(typeof selection.key === 'string'
                ? { key: selection.key }
                : {}),
              ...(Array.isArray(selection.ids) ? { ids: selection.ids } : {}),
            },
          },
        ];
      });
      const scope = check.decision.conditions?.scope;
      const described = isRecord(scope)
        ? describeScopeFilter(scope.root, operatorNames)
        : '';
      return {
        collection: check.resource.id,
        selections,
        ...(described ? { conditions: described } : {}),
      };
    });
}
