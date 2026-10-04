import {
  dataScopeTarget,
  type ResourceRef,
  type RuleAction,
} from '@nocobase/authorization/core';
import type { AuthorizationExtensionHost } from '../host.js';
import { AuthorizationInputError } from './http.js';

export interface DataScopeRuleInput {
  readonly resource: ResourceRef;
  readonly actions: readonly RuleAction[];
}

const COLLECTION_ACTIONS: readonly string[] = [
  'read',
  'create',
  'update',
  'delete',
];

/**
 * Checks a rule against the registered model: a composite's actions and data
 * scopes, or a registered collection's actions, and record access that
 * applies to the targeted collection. Throws `AuthorizationInputError`, a `TypeError` naming the offending field, such
 * as `actions.1.scopeKey`, which a settings router reports as a field violation.
 */
export function validateDataScopeRule(
  authz: Pick<
    AuthorizationExtensionHost,
    'compositeResources' | 'database' | 'recordAccess'
  >,
  rule: DataScopeRuleInput,
): void {
  const composite =
    rule.resource.type === 'composite'
      ? authz.compositeResources
          .list()
          .find((item) => item.name === rule.resource.id)
      : undefined;
  if (rule.resource.type === 'composite' && !composite)
    throw new AuthorizationInputError('Unknown composite', 'resource.id');
  if (!composite && rule.resource.type !== 'database.collection')
    throw new AuthorizationInputError(
      'Unsupported rule resource',
      'resource.type',
    );
  const collection = authz.database.collections
    .list()
    .find((item) => item.name === rule.resource.id);
  if (!composite && !collection)
    throw new AuthorizationInputError(
      'Unknown data rule collection',
      'resource.id',
    );
  const actions = composite
    ? composite.actions.map((item) => item.name)
    : (collection?.actions ?? COLLECTION_ACTIONS);
  if (
    new Set(
      rule.actions.map((item) => JSON.stringify([item.action, item.scopeKey])),
    ).size !== rule.actions.length
  )
    throw new AuthorizationInputError('Duplicate rule actions', 'actions');
  for (const [index, entry] of rule.actions.entries()) {
    const field = `actions.${index}`;
    if (
      (!composite && entry.action === 'create') ||
      !actions.includes(entry.action)
    )
      throw new AuthorizationInputError(
        'Unsupported data rule action',
        `${field}.action`,
      );
    const action = composite?.actions.find(
      (item) => item.name === entry.action,
    );
    const scope = action?.dataScopes?.find(
      (item) => item.key === entry.scopeKey,
    );
    const scopeTarget =
      action && scope ? dataScopeTarget(action, scope.key) : undefined;
    if (composite) {
      if (
        !scopeTarget ||
        scopeTarget.type !== 'database.collection' ||
        !authz.database.collections.has(scopeTarget.id)
      )
        throw new AuthorizationInputError(
          'Unknown composite resource data scope',
          `${field}.scopeKey`,
        );
    } else if (entry.scopeKey !== undefined)
      throw new AuthorizationInputError(
        'Collection rules do not accept scopeKey',
        `${field}.scopeKey`,
      );
    if (entry.selection.type !== 'recordAccess') continue;
    const definition = authz.recordAccess.get(entry.selection.key);
    if (!definition)
      throw new AuthorizationInputError(
        'Unknown record access',
        `${field}.selection.key`,
      );
    const target = scopeTarget?.id ?? rule.resource.id;
    if (
      !definition.collections.some((name) => name === '*' || name === target) ||
      (scope?.options && !scope.options.includes(definition.key))
    )
      throw new AuthorizationInputError(
        'Record access does not apply to this data scope',
        `${field}.selection.key`,
      );
  }
}
