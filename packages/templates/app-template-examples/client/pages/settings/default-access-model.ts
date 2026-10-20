import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import type { CatalogResource } from './permissions-model.js';

export type ScopeSelection =
  | { readonly type: 'all' }
  | { readonly type: 'records'; readonly ids: readonly string[] }
  | {
      readonly type: 'recordAccess';
      readonly key: string;
      readonly params?: unknown;
    };
export interface DefaultAccessAction {
  readonly action: string;
  readonly scopeKey?: string;
  readonly selection: ScopeSelection;
}
export interface DefaultAccessRule {
  readonly key: string;
  readonly resource: { readonly type: string; readonly id: string };
  readonly actions: readonly DefaultAccessAction[];
}
export interface RuleScope {
  readonly id: string;
  readonly action: string;
  readonly scopeKey?: string;
  readonly title: LocalizedText;
  readonly actionTitle: LocalizedText;
  readonly collection: string;
  readonly fields: readonly string[];
  readonly recordAccess: readonly string[];
}
export const resourceKey = (resource: DefaultAccessRule['resource']): string =>
  JSON.stringify([resource.type, resource.id]);
export const actionKey = (
  entry: Pick<DefaultAccessAction, 'action' | 'scopeKey'>,
): string => JSON.stringify([entry.action, entry.scopeKey ?? null]);
export function ruleResources(
  catalog: AuthorizationOptionsResponse,
): readonly CatalogResource[] {
  const resources = catalog.sections
    .flatMap((section) => section.subsections.flatMap((sub) => sub.resources))
    .filter((resource) =>
      Object.values(resource.dataScopes ?? {}).some((scopes) => scopes.length),
    );
  const seen = new Set<string>();
  return [
    ...resources,
    ...catalog.collections.map((collection) => ({
      type: 'database.collection',
      id: collection.name,
      title: collection.name,
      actions: ['read', 'update', 'delete'].map((name) => ({
        name,
        title: {
          key: `options.actions.${name}`,
          ns: '@nocobase/app-plugin-authorization',
        },
      })),
    })),
  ].filter((resource) => {
    const key = resourceKey(resource);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function ruleScopes(
  resource: CatalogResource | undefined,
  catalog: AuthorizationOptionsResponse,
): readonly RuleScope[] {
  if (!resource) return [];
  return resource.actions.flatMap<RuleScope>((action) =>
    resource.type === 'database.collection'
      ? [
          {
            id: actionKey({ action: action.name }),
            action: action.name,
            actionTitle: action.title,
            title: resource.title,
            collection: resource.id,
            fields:
              catalog.collections.find((entry) => entry.name === resource.id)
                ?.fields ?? [],
            recordAccess: catalog.recordAccess
              .filter(
                (entry) =>
                  entry.collections.includes('*') ||
                  entry.collections.includes(resource.id),
              )
              .map((entry) => entry.key),
          },
        ]
      : (resource.dataScopes?.[action.name] ?? []).map((scope) => ({
          id: actionKey({ action: action.name, scopeKey: scope.key }),
          action: action.name,
          scopeKey: scope.key,
          actionTitle: action.title,
          title: scope.title,
          collection: scope.collection,
          fields: scope.fields,
          recordAccess: scope.recordAccess,
        })),
  );
}
export function replaceRuleScope(
  rule: DefaultAccessRule,
  scope: RuleScope,
  selection: ScopeSelection | undefined,
): DefaultAccessRule {
  const existing = rule.actions.find((entry) => actionKey(entry) === scope.id);
  if (JSON.stringify(existing?.selection) === JSON.stringify(selection))
    return rule;
  const replacement = selection
    ? {
        action: scope.action,
        ...(scope.scopeKey === undefined ? {} : { scopeKey: scope.scopeKey }),
        selection,
      }
    : undefined;
  const actions = rule.actions.flatMap((entry) =>
    actionKey(entry) === scope.id
      ? replacement
        ? [replacement]
        : []
      : [entry],
  );
  if (!existing && replacement) actions.push(replacement);
  return { ...rule, actions };
}
/** Unknown catalog entries must not be silently rewritten by a whole-actions PATCH. */
export function editableRule(
  rule: DefaultAccessRule,
  scopes: readonly RuleScope[],
  catalog: AuthorizationOptionsResponse,
): boolean {
  return (
    scopes.length > 0 &&
    rule.actions.every((entry) => {
      const scope = scopes.find((scope) => scope.id === actionKey(entry));
      const selection = entry.selection;
      return (
        scope !== undefined &&
        (selection.type !== 'recordAccess' ||
          (scope.recordAccess.includes(selection.key) &&
            catalog.recordAccess.some(
              (preset) => preset.key === selection.key,
            )))
      );
    })
  );
}
