import { expect, it } from 'vitest';
import type { AuthorizationOptionsResponse } from '../../../client/index.js';
import {
  actionKey,
  ruleResourceLabels,
  suggestRuleKey,
  ruleResources,
  ruleScopes,
  replaceRuleScope,
  editableRule,
  type DefaultAccessRule,
} from '../../../client/settings/default-access-model.js';
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

it('titles data with registered collection titles and tells same-named business operations and tables apart', () => {
  const registered: AuthorizationOptionsResponse = {
    ...catalog,
    sections: [
      {
        ...catalog.sections[0]!,
        subsections: [
          {
            name: 'crm',
            title: 'CRM',
            resources: [
              {
                type: 'composite',
                id: 'crm.customers',
                title: 'Customers',
                actions: [{ name: 'view', title: 'View' }],
                dataScopes: {
                  view: [
                    {
                      // The server titles an untitled scope with its key.
                      key: 'crmCustomers',
                      title: 'crmCustomers',
                      collection: 'crmCustomers',
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
    collections: [
      { name: 'crmCustomers', title: 'Customers', fields: ['name'] },
    ],
  };
  const resources = ruleResources(registered);
  const text = (value: unknown) => String(value);
  expect(resources.map((entry) => [entry.type, text(entry.title)])).toEqual([
    ['composite', 'Customers'],
    ['database.collection', 'Customers'],
  ]);
  expect(
    ruleScopes(resources[0], registered).map((scope) => text(scope.title)),
  ).toEqual(['Customers']);
  expect([
    ...ruleResourceLabels(resources, text, (title, kind) =>
      kind === 'table'
        ? `${title} (data table)`
        : `${title} (business operations)`,
    ).values(),
  ]).toEqual(['Customers (business operations)', 'Customers (data table)']);
  // A name used once stays as it is.
  expect([
    ...ruleResourceLabels(resources.slice(0, 1), text, () => 'unused').values(),
  ]).toEqual(['Customers']);
});

it('suggests a new rule key from its name, or its object, numbered past keys in use', () => {
  expect(
    suggestRuleKey(
      'Sales managers see the team’s customers',
      'crm.customers',
      [],
    ),
  ).toBe('sales-managers-see-the-team-s-customers');
  expect(suggestRuleKey('Café Owners', 'x', [])).toBe('cafe-owners');
  // A name without Latin letters or digits falls back to the object.
  expect(suggestRuleKey('销售经理', 'crm.customers', [])).toBe('crm-customers');
  expect(suggestRuleKey('Team', 'x', ['team', 'team-2'])).toBe('team-3');
  expect(suggestRuleKey('Records', 'x', [])).toBe('records-2');
  expect(suggestRuleKey('', '', [])).toBe('');
});
