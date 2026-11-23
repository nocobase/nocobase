import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '../authorization-client.js';
import type { CatalogResource } from './permissions-model.js';
import type { PermissionWorkspaceSelection } from './workspace-selection.js';
import {
  collectionTitles,
  permissionScopeTitle,
} from './permission-workspace.js';

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
/** A rule of any kind: sharing and restriction rules also name their subjects, a title and a reason. */
export interface DataRule extends DefaultAccessRule {
  readonly title?: string | { readonly key: string; readonly ns: string };
  readonly subjects?: readonly { readonly type: string; readonly id: string }[];
  readonly reason?: string;
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
  selection?: PermissionWorkspaceSelection,
): readonly CatalogResource[] {
  const resources = catalog.sections
    .flatMap((section) => section.subsections.flatMap((sub) => sub.resources))
    .filter((resource) =>
      Object.values(resource.dataScopes ?? {}).some((scopes) => scopes.length),
    );
  const titles = collectionTitles(catalog);
  const seen = new Set<string>();
  return [
    ...resources,
    ...catalog.collections.map((collection) => ({
      type: 'database.collection',
      id: collection.name,
      title: permissionScopeTitle(
        { type: 'database.collection', id: collection.name },
        { collection: collection.name, title: collection.name },
        selection,
        undefined,
        titles,
      ),
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
/** Candidates for a new rule. Default access also excludes objects that already have a rule. */
export function newRuleResources(
  resources: readonly CatalogResource[],
  selection: PermissionWorkspaceSelection,
  existing: readonly DataRule[],
): readonly CatalogResource[] {
  const used = new Set(existing.map((rule) => resourceKey(rule.resource)));
  return resources.filter(
    (resource) =>
      !selection.excludedNewRuleResources?.[resource.type]?.includes(
        resource.id,
      ) && !used.has(resourceKey(resource)),
  );
}
/**
 * Labels of rule resources by `resourceKey`. A business resource and a data table often share a name, such as
 * Customers; those labels say which kind each one is.
 */
export function ruleResourceLabels(
  resources: readonly CatalogResource[],
  text: (value: LocalizedText) => string,
  label: (title: string, kind: 'business' | 'table') => string,
): ReadonlyMap<string, string> {
  const titles = resources.map((resource) => text(resource.title));
  return new Map(
    resources.map((resource, index) => {
      const title = titles[index];
      const shared = titles.filter((other) => other === title).length > 1;
      return [
        resourceKey(resource),
        shared
          ? label(
              title,
              resource.type === 'database.collection' ? 'table' : 'business',
            )
          : title,
      ];
    }),
  );
}
export function ruleScopes(
  resource: CatalogResource | undefined,
  catalog: AuthorizationOptionsResponse,
  selection?: PermissionWorkspaceSelection,
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
          title: permissionScopeTitle(
            resource,
            scope,
            selection,
            action.name,
            collectionTitles(catalog),
          ),
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

/** Keys the rule routes use for their own paths, so a rule cannot take them. */
export const RESERVED_RULE_KEYS: readonly string[] = [
  'options',
  'subjects',
  'records',
];

const slug = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 48)
    .replace(/-+$/, '');

/**
 * The key a new rule gets until the person types one: its name in lowercase words joined by hyphens, or its object's
 * id when the name has no Latin letters or digits, numbered on when another rule or a route already uses it.
 */
export function suggestRuleKey(
  title: string,
  resourceId: string,
  taken: readonly string[],
): string {
  const base = slug(title) || slug(resourceId);
  if (!base) return '';
  const used = new Set([...taken, ...RESERVED_RULE_KEYS]);
  let key = base;
  for (let n = 2; used.has(key); n += 1) key = `${base}-${n}`;
  return key;
}
