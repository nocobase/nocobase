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

/** The sources of the grants a decision matched: `{ plugin: 'permission-sets', id }` names a role. */
export function matchedSources(
  decision: AuthorizationDecision,
): readonly { readonly plugin: string; readonly id: string }[] {
  return decision.reasons.flatMap((reason) => {
    if (reason.code !== 'GRANT_MATCHED') return [];
    const source: unknown = reason.details?.source;
    if (!source || typeof source !== 'object') return [];
    const plugin: unknown = Reflect.get(source, 'plugin');
    const id: unknown = Reflect.get(source, 'id');
    return typeof plugin === 'string' && typeof id === 'string'
      ? [{ plugin, id }]
      : [];
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
