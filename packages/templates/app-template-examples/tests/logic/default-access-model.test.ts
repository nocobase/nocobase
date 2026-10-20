import { expect, it } from 'vitest';
import type { AuthorizationOptionsResponse } from '@nocobase/app-plugin-authorization/client';
import {
  actionKey,
  ruleResources,
  ruleScopes,
  replaceRuleScope,
  editableRule,
  type DefaultAccessRule,
} from '../../client/pages/settings/default-access-model.js';
const catalog: AuthorizationOptionsResponse = {
  sections: [
    {
      name: 'business',
      title: 'Business',
      order: 0,
      subsections: [
        {
          name: 'projects',
          title: 'Projects',
          resources: [
            {
              type: 'composite',
              id: 'projects',
              title: 'Projects',
              actions: [
                { name: 'view', title: 'View' },
                { name: 'submit', title: 'Submit' },
              ],
              dataScopes: {
                view: [
                  {
                    key: 'projects',
                    title: 'Projects',
                    collection: 'projects',
                    fields: ['name'],
                    recordAccess: ['own', 'customFilter'],
                  },
                ],
                submit: [
                  {
                    key: 'projects',
                    title: 'Projects',
                    collection: 'projects',
                    fields: ['name'],
                    recordAccess: ['own'],
                  },
                  {
                    key: 'quotes',
                    title: 'Quotes',
                    collection: 'quotes',
                    fields: ['name'],
                    recordAccess: ['own'],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  subjectTypes: [],
  recordAccess: [
    { key: 'own', title: 'Own', collections: ['*'] },
    { key: 'customFilter', title: 'Custom', collections: ['*'] },
  ],
  collections: [{ name: 'projects', fields: ['name'] }],
};
const resource = ruleResources(catalog)[0]!;
const scopes = ruleScopes(resource, catalog);
const rule: DefaultAccessRule = {
  key: 'baseline',
  resource: { type: 'composite', id: 'projects' },
  actions: [
    {
      action: 'view',
      scopeKey: 'projects',
      selection: {
        type: 'recordAccess',
        key: 'customFilter',
        params: { filter: { $and: [{ name: { $eq: 'Secret' } }] } },
      },
    },
    {
      action: 'submit',
      scopeKey: 'quotes',
      selection: { type: 'records', ids: ['q1', 'q2'] },
    },
    {
      action: 'submit',
      scopeKey: 'projects',
      selection: {
        type: 'recordAccess',
        key: 'own',
        params: { preserved: { value: true } },
      },
    },
  ],
};
it('updates exactly one independently keyed scope without mutating advanced filters, record IDs or unrelated parameters', () => {
  const before = structuredClone(rule);
  const changed = replaceRuleScope(
    rule,
    scopes.find(
      (scope) =>
        scope.id === actionKey({ action: 'submit', scopeKey: 'projects' }),
    )!,
    { type: 'all' },
  );
  expect(changed.actions[0]).toEqual(rule.actions[0]);
  expect(changed.actions[1]).toEqual(rule.actions[1]);
  expect(changed.actions[2]?.selection).toEqual({ type: 'all' });
  expect(rule).toEqual(before);
  expect(
    replaceRuleScope(changed, scopes[0]!, changed.actions[0]!.selection),
  ).toBe(changed);
});
it('removes only an explicit scope and adds no default for unconfigured operations', () => {
  const removed = replaceRuleScope(rule, scopes[0]!, undefined);
  expect(removed.actions).toEqual(rule.actions.slice(1));
  const empty = { ...rule, actions: [] };
  expect(replaceRuleScope(empty, scopes[0]!, undefined)).toBe(empty);
});
it('preserves unknown entries and makes them read-only instead of dropping them from an update', () => {
  expect(editableRule(rule, scopes, catalog)).toBe(true);
  for (const changed of [
    {
      ...rule,
      actions: [
        ...rule.actions,
        { action: 'legacy', selection: { type: 'all' as const } },
      ],
    },
    {
      ...rule,
      actions: [
        {
          action: 'view',
          scopeKey: 'projects',
          selection: { type: 'recordAccess' as const, key: 'removed' },
        },
      ],
    },
  ]) {
    const snapshot = structuredClone(changed);
    expect(editableRule(changed, scopes, catalog)).toBe(false);
    expect(changed).toEqual(snapshot);
  }
  expect(editableRule(rule, [], catalog)).toBe(false);
});
it('offers database rules without unsupported create actions and never confuses collection and composite scopes', () => {
  const collection = ruleResources(catalog).find(
    (resource) => resource.type === 'database.collection',
  )!;
  expect(
    ruleScopes(collection, catalog).map((scope) => [
      scope.action,
      scope.scopeKey,
    ]),
  ).toEqual([
    ['read', undefined],
    ['update', undefined],
    ['delete', undefined],
  ]);
  expect(new Set(scopes.map((scope) => scope.id)).size).toBe(scopes.length);
});
