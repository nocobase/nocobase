import { describe, expect, it } from 'vitest';
import {
  applyQuickSet,
  dependentsOf,
  effectiveScopeValue,
  filterModules,
  menuStatus,
  narrowerOptions,
  nextMenu,
  orderedActions,
  setActionEnabled,
  setScopeValue,
  visibleMenuCount,
  type PermissionGrants,
  type PermissionModule,
} from '../../registry/authorization/permission-editor-model.js';

const RECORDS = [
  { value: 'all', label: 'All records' },
  { value: 'department', label: 'Their department' },
  { value: 'own', label: 'Their own records' },
];

const modules: readonly PermissionModule[] = [
  {
    id: 'home',
    label: 'Home',
    menus: [{ id: 'dashboard', label: 'Dashboard', public: true, actions: [] }],
  },
  {
    id: 'sales',
    label: 'Sales',
    menus: [
      {
        id: 'contracts',
        label: 'Contracts',
        actions: [
          {
            id: 'contracts.archive',
            label: 'Archive',
            business: true,
            scopes: [{ id: 'records', followsView: true }],
          },
          {
            id: 'contracts.update',
            label: 'Edit',
            scopes: [{ id: 'records', followsView: true }],
          },
          {
            id: 'contracts.view',
            label: 'View',
            view: true,
            scopes: [{ id: 'records', options: RECORDS }],
          },
          {
            id: 'contracts.export',
            label: 'Export',
            risk: 'sensitive',
            scopes: [{ id: 'records', followsView: true }],
          },
          {
            id: 'contracts.approve',
            label: 'Approve',
            business: true,
            scopes: [
              {
                id: 'amount',
                label: 'Amount',
                options: [
                  { value: 'any', label: 'No limit' },
                  { value: '100k', label: '$100,000' },
                ],
              },
              { id: 'department', label: 'Department', options: RECORDS },
            ],
          },
        ],
      },
      {
        id: 'payments',
        label: 'Payments',
        actions: [
          { id: 'payments.view', label: 'View payments', view: true },
          {
            id: 'payments.collect',
            label: 'Collect payment',
            requires: ['payments.view', 'contracts.view'],
          },
          {
            id: 'payments.refund',
            label: 'Refund',
            requires: ['payments.secret'],
          },
          { id: 'payments.secret', label: 'Bank details', risk: 'high' },
          {
            id: 'payments.audit',
            label: 'Audit trail',
            managed: true,
            requires: ['payments.view'],
          },
          {
            id: 'payments.export',
            label: 'Export payments',
            requires: ['payments.ledger'],
          },
          { id: 'payments.ledger', label: 'Ledger sync', managed: true },
        ],
      },
      {
        id: 'shipments',
        label: 'Shipments',
        actions: [
          {
            id: 'shipments.view',
            label: 'View shipments',
            view: true,
            scopes: [{ id: 'records', options: RECORDS }],
          },
          {
            // Supports only two of View's levels.
            id: 'shipments.sign',
            label: 'Sign',
            scopes: [
              {
                id: 'records',
                followsView: true,
                options: [
                  { value: 'all', label: 'All shipments' },
                  { value: 'own', label: 'Their own shipments' },
                ],
              },
            ],
          },
          {
            id: 'shipments.submit',
            label: 'Submit',
            business: true,
            scopes: [
              {
                id: 'records',
                label: 'Shipments allowed',
                followsView: true,
                options: [
                  { value: 'all', label: 'All shipments' },
                  {
                    value: 'department',
                    label: 'Their department’s shipments',
                  },
                  { value: 'own', label: 'Shipments they prepared' },
                ],
              },
              {
                id: 'projects',
                label: 'Linked projects',
                options: [
                  { value: 'all', label: 'All projects' },
                  { value: 'own', label: 'Projects they own' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const contracts = modules[1]!.menus[0]!;
const view = contracts.actions[2]!;
const update = contracts.actions[1]!;
const updateSlot = update.scopes![0]!;
const payments = modules[1]!.menus[1]!;
const shipments = modules[1]!.menus[2]!;
const signSlot = shipments.actions[1]!.scopes![0]!;
const submitSlot = shipments.actions[2]!.scopes![0]!;

describe('permission editor model', () => {
  it('lists View first, then basic actions, then business actions in caller order', () => {
    const { basic, business } = orderedActions(contracts);
    expect(basic.map((action) => action.label)).toEqual([
      'View',
      'Edit',
      'Export',
    ]);
    expect(business.map((action) => action.label)).toEqual([
      'Archive',
      'Approve',
    ]);
  });

  it('lets other actions follow the View scope and offers only narrower ones', () => {
    const grants: PermissionGrants = {
      'contracts.view': { scopes: { records: 'department' } },
      'contracts.update': {},
    };
    expect(effectiveScopeValue(contracts, grants, update, updateSlot)).toBe(
      'department',
    );
    expect(
      narrowerOptions(contracts, grants, updateSlot).map(
        (option) => option.value,
      ),
    ).toEqual(['own']);
    // A wider or equal choice simply follows View.
    const wider = setScopeValue(
      modules,
      grants,
      'contracts.update',
      'records',
      'all',
    );
    expect(wider.grants['contracts.update']?.scopes).toEqual({});
  });

  it('sends wider followers back to Same as view when View narrows, and says so', () => {
    const grants: PermissionGrants = {
      'contracts.view': { scopes: { records: 'all' } },
      'contracts.update': { scopes: { records: 'department' } },
      'contracts.archive': { scopes: { records: 'own' } },
    };
    const narrowed = setScopeValue(
      modules,
      grants,
      'contracts.view',
      'records',
      'department',
    );
    expect(narrowed.grants['contracts.archive']?.scopes).toEqual({
      records: 'own',
    });
    const change = setScopeValue(
      modules,
      grants,
      'contracts.view',
      'records',
      'own',
    );
    expect(change.grants['contracts.update']?.scopes).toEqual({});
    // Archive was already Their own records: it follows View without being named.
    expect(change.grants['contracts.archive']?.scopes).toEqual({});
    expect(change.notices).toEqual([
      { kind: 'scope-reset', view: 'Their own records', actions: ['Edit'] },
    ]);
    expect(
      effectiveScopeValue(contracts, change.grants, update, updateSlot),
    ).toBe('own');
  });

  it('lets a follower equal to the new View scope follow it without a notice', () => {
    const change = setScopeValue(
      modules,
      {
        'contracts.view': { scopes: { records: 'all' } },
        'contracts.update': { scopes: { records: 'department' } },
      },
      'contracts.view',
      'records',
      'department',
    );
    expect(change.grants['contracts.update']?.scopes).toEqual({});
    expect(change.notices).toEqual([]);
  });

  it('offers only declared subsets when View options filter different things', () => {
    // Region and Public filter different fields: a public project can be in another region.
    const projects = {
      id: 'projects',
      label: 'Projects',
      actions: [
        {
          id: 'projects.view',
          label: 'View',
          view: true,
          scopes: [
            {
              id: 'records',
              options: [
                { value: 'all', label: 'All records' },
                { value: 'region', label: 'Their region' },
                { value: 'public', label: 'Public projects' },
                { value: 'none', label: 'No records' },
              ],
              narrower: {
                all: ['region', 'public', 'none'],
                region: ['none'],
                public: ['none'],
              },
            },
          ],
        },
        {
          id: 'projects.edit',
          label: 'Edit',
          scopes: [{ id: 'records', followsView: true }],
        },
      ],
    } satisfies PermissionModule['menus'][number];
    const projectModules: readonly PermissionModule[] = [
      { id: 'sales', label: 'Sales', menus: [projects] },
    ];
    const edit = projects.actions[1]!;
    const slot = edit.scopes[0]!;
    const regional: PermissionGrants = {
      'projects.view': { scopes: { records: 'region' } },
      'projects.edit': {},
    };
    expect(
      narrowerOptions(projects, regional, slot).map((option) => option.value),
    ).toEqual(['none']);
    // Public is not inside Their region, so choosing it keeps Edit on Same as view.
    const picked = setScopeValue(
      projectModules,
      regional,
      'projects.edit',
      'records',
      'public',
    );
    expect(picked.grants['projects.edit']?.scopes).toEqual({});
    // Edit on Public under View All goes back to Same as view when View becomes Their region.
    const change = setScopeValue(
      projectModules,
      {
        'projects.view': { scopes: { records: 'all' } },
        'projects.edit': { scopes: { records: 'public' } },
      },
      'projects.view',
      'records',
      'region',
    );
    expect(change.grants['projects.edit']?.scopes).toEqual({});
    expect(change.notices).toEqual([
      { kind: 'scope-reset', view: 'Their region', actions: ['Edit'] },
    ]);
    expect(effectiveScopeValue(projects, change.grants, edit, slot)).toBe(
      'region',
    );
  });

  it('lets a second resource on a menu follow its own View', () => {
    const people = {
      id: 'people',
      label: 'Customers and contacts',
      actions: [
        {
          id: 'customers.view',
          label: 'View customers',
          view: true,
          scopes: [{ id: 'records', options: RECORDS }],
        },
        {
          id: 'contacts.view',
          label: 'View contacts',
          requires: ['customers.view'],
          scopes: [{ id: 'records', options: RECORDS }],
        },
        {
          id: 'contacts.edit',
          label: 'Edit contacts',
          requires: ['contacts.view'],
          scopes: [{ id: 'records', followsView: 'contacts.view' }],
        },
      ],
    } satisfies PermissionModule['menus'][number];
    const peopleModules: readonly PermissionModule[] = [
      { id: 'crm', label: 'CRM', menus: [people] },
    ];
    const edit = people.actions[2]!;
    const slot = edit.scopes[0]!;
    const grants: PermissionGrants = {
      'customers.view': { scopes: { records: 'all' } },
      'contacts.view': { scopes: { records: 'department' } },
      'contacts.edit': {},
    };
    expect(effectiveScopeValue(people, grants, edit, slot)).toBe('department');
    expect(
      narrowerOptions(people, grants, slot).map((option) => option.value),
    ).toEqual(['own']);
    // All records is wider than the contacts' own View, though the menu's View allows it.
    expect(
      setScopeValue(peopleModules, grants, 'contacts.edit', 'records', 'all')
        .grants['contacts.edit']?.scopes,
    ).toEqual({});
    const change = setScopeValue(
      peopleModules,
      {
        ...grants,
        'contacts.view': { scopes: { records: 'all' } },
        'contacts.edit': { scopes: { records: 'department' } },
      },
      'contacts.view',
      'records',
      'own',
    );
    expect(change.grants['contacts.edit']?.scopes).toEqual({});
    expect(change.notices).toEqual([
      {
        kind: 'scope-reset',
        view: 'Their own records',
        actions: ['Edit contacts'],
      },
    ]);
  });

  it('keeps the scopes of a multi-scope action independent of View', () => {
    const grants: PermissionGrants = {
      'contracts.view': { scopes: { records: 'all' } },
      'contracts.approve': { scopes: { amount: '100k', department: 'all' } },
    };
    const change = setScopeValue(
      modules,
      grants,
      'contracts.view',
      'records',
      'own',
    );
    expect(change.grants['contracts.approve']?.scopes).toEqual({
      amount: '100k',
      department: 'all',
    });
    expect(change.notices).toEqual([]);
  });

  it('turns on what an action requires and asks to turn off what needs it', () => {
    const on = setActionEnabled(modules, {}, 'payments.collect', true);
    expect(Object.keys(on.grants).sort()).toEqual([
      'contracts.view',
      'payments.collect',
      'payments.view',
    ]);
    expect(on.notices).toEqual([
      { kind: 'auto-enabled', actions: ['View payments', 'View'] },
    ]);
    expect(
      dependentsOf(modules, on.grants, ['contracts.view']).map(
        (action) => action.id,
      ),
    ).toEqual(['payments.collect']);
    const off = setActionEnabled(modules, on.grants, 'contracts.view', false);
    expect(Object.keys(off.grants)).toEqual(['payments.view']);
  });

  it('ranks a follower with fewer options by View’s order and never offers a wider one', () => {
    const grants: PermissionGrants = {
      'shipments.view': { scopes: { records: 'department' } },
      'shipments.sign': {},
    };
    expect(
      narrowerOptions(shipments, grants, signSlot).map(
        (option) => option.value,
      ),
    ).toEqual(['own']);
    const wider = setScopeValue(
      modules,
      grants,
      'shipments.sign',
      'records',
      'all',
    );
    expect(wider.grants['shipments.sign']?.scopes).toEqual({});
    // Narrowing View keeps a follower that is still narrower, even if its own option list is shorter.
    const narrowed = setScopeValue(
      modules,
      {
        'shipments.view': { scopes: { records: 'all' } },
        'shipments.sign': { scopes: { records: 'own' } },
      },
      'shipments.view',
      'records',
      'department',
    );
    expect(narrowed.grants['shipments.sign']?.scopes).toEqual({
      records: 'own',
    });
    expect(narrowed.notices).toEqual([]);
  });

  it('keeps a two-scope action within View for its records and independent for linked projects', () => {
    const grants: PermissionGrants = {
      'shipments.view': { scopes: { records: 'department' } },
      'shipments.submit': {},
    };
    expect(
      narrowerOptions(shipments, grants, submitSlot).map(
        (option) => option.value,
      ),
    ).toEqual(['own']);
    const wider = setScopeValue(
      modules,
      grants,
      'shipments.submit',
      'records',
      'all',
    );
    expect(wider.grants['shipments.submit']?.scopes).toEqual({});
    const projects = setScopeValue(
      modules,
      wider.grants,
      'shipments.submit',
      'projects',
      'all',
    );
    expect(projects.grants['shipments.submit']?.scopes).toEqual({
      projects: 'all',
    });
  });

  it('leaves an action off when a requirement is risky or managed and still off', () => {
    const refund = setActionEnabled(modules, {}, 'payments.refund', true);
    expect(refund.grants).toEqual({});
    expect(refund.notices).toEqual([
      {
        kind: 'missing-requirement',
        action: 'Refund',
        actions: ['Bank details'],
        managed: [],
      },
    ]);
    const exported = setActionEnabled(modules, {}, 'payments.export', true);
    expect(exported.grants).toEqual({});
    expect(exported.notices).toEqual([
      {
        kind: 'missing-requirement',
        action: 'Export payments',
        actions: [],
        managed: ['Ledger sync'],
      },
    ]);
    // Once the risky requirement and its own View are on, the action can be granted.
    expect(
      setActionEnabled(
        modules,
        { 'payments.view': {}, 'payments.secret': {} },
        'payments.refund',
        true,
      ).grants,
    ).toEqual({
      'payments.view': {},
      'payments.secret': {},
      'payments.refund': {},
    });
  });

  it('follows requirements through ones already on, so nothing is granted without its whole chain', () => {
    // Bank details is on but its own View payments is off, as a stored role may be.
    const refund = setActionEnabled(
      modules,
      { 'payments.secret': {} },
      'payments.refund',
      true,
    );
    expect(refund.grants['payments.view']).toEqual({});
    expect(Object.keys(refund.grants).sort()).toEqual([
      'payments.refund',
      'payments.secret',
      'payments.view',
    ]);
    expect(refund.notices).toEqual([
      { kind: 'auto-enabled', actions: ['View payments'] },
    ]);
    // A chain that reaches a managed action still off leaves the action off.
    const exported = setActionEnabled(
      modules,
      { 'payments.view': {} },
      'payments.export',
      true,
    );
    expect(exported.grants).toEqual({ 'payments.view': {} });
  });

  it('refuses to turn off what an enabled managed action needs', () => {
    const grants: PermissionGrants = {
      'payments.view': {},
      'payments.audit': {},
    };
    const off = setActionEnabled(modules, grants, 'payments.view', false);
    expect(off.grants).toBe(grants);
    expect(off.notices).toEqual([
      { kind: 'managed-dependent', actions: ['Audit trail'] },
    ]);
    expect(applyQuickSet(modules, grants, payments, 'none').grants).toBe(
      grants,
    );
  });

  it('never turns on a risky action automatically', () => {
    const all = applyQuickSet(modules, {}, contracts, 'all');
    expect(all.grants['contracts.export']).toBeUndefined();
    expect(Object.keys(all.grants)).toHaveLength(4);
  });

  it('applies View only and Disable all to one menu', () => {
    const all = applyQuickSet(modules, {}, contracts, 'all').grants;
    expect(
      Object.keys(applyQuickSet(modules, all, contracts, 'view').grants),
    ).toEqual(['contracts.view']);
    expect(applyQuickSet(modules, all, contracts, 'none').grants).toEqual({});
  });

  it('derives menu status, visibility and the next menu', () => {
    const grants: PermissionGrants = { 'contracts.view': {} };
    expect(menuStatus(contracts, grants)).toEqual({
      state: 'partial',
      enabled: 1,
      total: 5,
    });
    expect(menuStatus(modules[0]!.menus[0]!, grants).state).toBe('public');
    expect(visibleMenuCount(modules, grants)).toEqual({ visible: 1, total: 3 });
    expect(visibleMenuCount(modules, {})).toEqual({ visible: 0, total: 3 });
    expect(nextMenu(modules, 'contracts')?.id).toBe('payments');
    expect(nextMenu(modules, 'payments')?.id).toBe('shipments');
    expect(nextMenu(modules, 'shipments')).toBeUndefined();
    const withAdministration: readonly PermissionModule[] = [
      ...modules,
      {
        id: 'settings',
        label: 'Settings',
        administration: true,
        menus: [
          {
            id: 'roles',
            label: 'Roles',
            actions: [{ id: 'roles.view', label: 'View roles', view: true }],
          },
          {
            id: 'users',
            label: 'Users',
            actions: [{ id: 'users.view', label: 'View users', view: true }],
          },
        ],
      },
    ];
    // Business menus stop at their end; Administration leads through its own menus.
    expect(nextMenu(withAdministration, 'shipments')).toBeUndefined();
    expect(nextMenu(withAdministration, 'roles')?.id).toBe('users');
  });

  it('filters the tree by menu or action name', () => {
    expect(
      filterModules(modules, 'refund').map((module) =>
        module.menus.map((menu) => menu.id),
      ),
    ).toEqual([['payments']]);
    expect(filterModules(modules, 'nothing')).toEqual([]);
    expect(filterModules(modules, '  ')).toBe(modules);
  });

  it('ignores a View action without its own grant', () => {
    expect(view.view).toBe(true);
    expect(
      setScopeValue(modules, {}, 'contracts.view', 'records', 'own').grants,
    ).toEqual({});
  });
});
