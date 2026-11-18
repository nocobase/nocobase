import { describe, expect, it } from 'vitest';
import {
  applyQuickSet,
  dependentsOf,
  effectiveScopeValue,
  filterObjects,
  followedObject,
  menuCheckState,
  menuCount,
  menuDependents,
  menuLeaves,
  menusUsing,
  menuWarnings,
  narrowerOptions,
  objectCount,
  objectStatus,
  orderedActions,
  setActionEnabled,
  setScopeValue,
  setMenuChecked,
  visibleMenuCount,
  type PermissionGrants,
  type PermissionMenuNode,
  type PermissionValue,
  type PermissionObject,
} from '../../registry/authorization/permission-editor-model.js';

const RECORDS = [
  { value: 'all', label: 'All records' },
  { value: 'department', label: 'Their department' },
  { value: 'own', label: 'Their own records' },
];

const objects: readonly PermissionObject[] = [
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
];

const contracts = objects[0]!;
const view = contracts.actions[2]!;
const update = contracts.actions[1]!;
const updateSlot = update.scopes![0]!;
const payments = objects[1]!;
const shipments = objects[2]!;
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
      objects,
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
      objects,
      grants,
      'contracts.view',
      'records',
      'department',
    );
    expect(narrowed.grants['contracts.archive']?.scopes).toEqual({
      records: 'own',
    });
    const change = setScopeValue(
      objects,
      grants,
      'contracts.view',
      'records',
      'own',
    );
    expect(change.grants['contracts.update']?.scopes).toEqual({});
    // Archive was already Their own records: it follows View too, and is named so the change in its select is
    // explained.
    expect(change.grants['contracts.archive']?.scopes).toEqual({});
    expect(change.notices).toEqual([
      {
        kind: 'scope-reset',
        view: 'Their own records',
        actions: ['Archive', 'Edit'],
      },
    ]);
    expect(
      effectiveScopeValue(contracts, change.grants, update, updateSlot),
    ).toBe('own');
  });

  it('names a follower equal to the new View scope when it goes back to following it', () => {
    const change = setScopeValue(
      objects,
      {
        'contracts.view': { scopes: { records: 'all' } },
        'contracts.update': { scopes: { records: 'department' } },
      },
      'contracts.view',
      'records',
      'department',
    );
    expect(change.grants['contracts.update']?.scopes).toEqual({});
    expect(change.notices).toEqual([
      { kind: 'scope-reset', view: 'Their department', actions: ['Edit'] },
    ]);
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
    } satisfies PermissionObject;
    const projectModules: readonly PermissionObject[] = [projects];
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

  it('lets a follower name the action it follows', () => {
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
    } satisfies PermissionObject;
    const peopleModules: readonly PermissionObject[] = [people];
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
    // All records is wider than the contacts' own View, though the object's View allows it.
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

  it('lets a slot reading another object follow that object’s View, set in one place', () => {
    const customers = {
      id: 'customers',
      label: 'Customers',
      actions: [
        {
          id: 'customers.view',
          label: 'View customers',
          view: true,
          scopes: [{ id: 'records', options: RECORDS }],
        },
      ],
    } satisfies PermissionObject;
    const contacts = {
      id: 'contacts',
      label: 'Contacts',
      actions: [
        {
          id: 'contacts.view',
          label: 'View contacts',
          view: true,
          scopes: [{ id: 'records', options: RECORDS }],
        },
        {
          id: 'contacts.create',
          label: 'Create contacts',
          scopes: [
            {
              id: 'customers',
              label: 'Customers',
              options: RECORDS,
              defaultValue: 'own',
              followsView: 'customers.view',
            },
          ],
        },
      ],
    } satisfies PermissionObject;
    const all: readonly PermissionObject[] = [customers, contacts];
    const create = contacts.actions[1]!;
    const slot = create.scopes[0]!;
    const grants: PermissionGrants = {
      'customers.view': { scopes: { records: 'department' } },
      'contacts.view': { scopes: { records: 'all' } },
      'contacts.create': {},
    };
    expect(effectiveScopeValue(contacts, grants, create, slot, all)).toBe(
      'department',
    );
    expect(followedObject(contacts, slot, all, grants)).toBe(customers);
    expect(
      narrowerOptions(contacts, grants, slot, all).map(
        (option) => option.value,
      ),
    ).toEqual(['own']);
    // Wider than Customers' View is refused: the customer scope is never wider than the one set on Customers.
    expect(
      setScopeValue(all, grants, 'contacts.create', 'customers', 'all').grants[
        'contacts.create'
      ]?.scopes,
    ).toEqual({});
    // Narrowing Customers' View sends a wider follower in another object back to following it, and says so.
    const change = setScopeValue(
      all,
      {
        ...grants,
        'customers.view': { scopes: { records: 'all' } },
        'contacts.create': { scopes: { customers: 'department' } },
      },
      'customers.view',
      'records',
      'own',
    );
    expect(change.grants['contacts.create']?.scopes).toEqual({});
    expect(change.notices).toEqual([
      {
        kind: 'scope-reset',
        view: 'Their own records',
        actions: ['Create contacts'],
      },
    ]);
    // With Customers' View off, the slot uses its own default and options.
    const off = { 'contacts.view': {}, 'contacts.create': {} };
    expect(effectiveScopeValue(contacts, off, create, slot, all)).toBe('own');
    expect(followedObject(contacts, slot, all, off)).toBeUndefined();
  });

  it('keeps the scopes of a multi-scope action independent of View', () => {
    const grants: PermissionGrants = {
      'contracts.view': { scopes: { records: 'all' } },
      'contracts.approve': { scopes: { amount: '100k', department: 'all' } },
    };
    const change = setScopeValue(
      objects,
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
    const on = setActionEnabled(objects, {}, 'payments.collect', true);
    expect(Object.keys(on.grants).sort()).toEqual([
      'contracts.view',
      'payments.collect',
      'payments.view',
    ]);
    expect(on.notices).toEqual([
      { kind: 'auto-enabled', actions: ['View payments', 'View'] },
    ]);
    expect(
      dependentsOf(objects, on.grants, ['contracts.view']).map(
        (action) => action.id,
      ),
    ).toEqual(['payments.collect']);
    const off = setActionEnabled(objects, on.grants, 'contracts.view', false);
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
      objects,
      grants,
      'shipments.sign',
      'records',
      'all',
    );
    expect(wider.grants['shipments.sign']?.scopes).toEqual({});
    // Narrowing View keeps a follower that is still narrower, even if its own option list is shorter.
    const narrowed = setScopeValue(
      objects,
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
      objects,
      grants,
      'shipments.submit',
      'records',
      'all',
    );
    expect(wider.grants['shipments.submit']?.scopes).toEqual({});
    const projects = setScopeValue(
      objects,
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
    const refund = setActionEnabled(objects, {}, 'payments.refund', true);
    expect(refund.grants).toEqual({});
    expect(refund.notices).toEqual([
      {
        kind: 'missing-requirement',
        action: 'Refund',
        actions: ['Bank details'],
        managed: [],
      },
    ]);
    const exported = setActionEnabled(objects, {}, 'payments.export', true);
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
        objects,
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
      objects,
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
      objects,
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
    const off = setActionEnabled(objects, grants, 'payments.view', false);
    expect(off.grants).toBe(grants);
    expect(off.notices).toEqual([
      { kind: 'managed-dependent', actions: ['Audit trail'] },
    ]);
    expect(applyQuickSet(objects, grants, payments, 'none').grants).toBe(
      grants,
    );
  });

  it('never turns on a risky action automatically', () => {
    const all = applyQuickSet(objects, {}, contracts, 'all');
    expect(all.grants['contracts.export']).toBeUndefined();
    expect(Object.keys(all.grants)).toHaveLength(4);
  });

  it('applies View only and Disable all to one menu', () => {
    const all = applyQuickSet(objects, {}, contracts, 'all').grants;
    expect(
      Object.keys(applyQuickSet(objects, all, contracts, 'view').grants),
    ).toEqual(['contracts.view']);
    expect(applyQuickSet(objects, all, contracts, 'none').grants).toEqual({});
  });

  it('derives object status and counts, and filters objects by object or action name', () => {
    const grants: PermissionGrants = { 'contracts.view': {} };
    expect(objectStatus(contracts, grants)).toEqual({
      state: 'partial',
      enabled: 1,
      total: 5,
    });
    expect(objectStatus(payments, grants).state).toBe('off');
    expect(objectCount(objects, grants)).toEqual({ enabled: 1, total: 3 });
    expect(filterObjects(objects, 'refund').map((item) => item.id)).toEqual([
      'payments',
    ]);
    expect(filterObjects(objects, 'nothing')).toEqual([]);
    expect(filterObjects(objects, '  ')).toBe(objects);
  });

  describe('menus', () => {
    const menus: readonly PermissionMenuNode[] = [
      {
        id: 'main',
        label: 'Main menu',
        children: [
          { id: 'home', label: 'Home', public: true },
          {
            id: 'contracts-page',
            label: 'Contracts',
            uses: { primary: ['contracts'], related: ['payments'] },
          },
          {
            id: 'payments-page',
            label: 'Payments',
            uses: { primary: ['payments'], related: ['contracts'] },
          },
        ],
      },
      {
        id: 'admin',
        label: 'Administration',
        children: [
          {
            id: 'shipments-page',
            label: 'Shipping settings',
            opensWith: 'shipments.view',
          },
        ],
      },
    ];

    it('checks menus independently of objects and derives group states and counts', () => {
      const value: PermissionValue = { menus: ['contracts-page'], grants: {} };
      expect(menuLeaves(menus).map((menu) => menu.id)).toEqual([
        'home',
        'contracts-page',
        'payments-page',
        'shipments-page',
      ]);
      expect(menuCheckState(menus[0]!, value)).toBe('mixed');
      expect(menuCheckState(menus[1]!, value)).toBe('unchecked');
      // Public menus count as checked; they never need a permission.
      expect(menuCount(menus, value)).toEqual({ checked: 2, total: 4 });
      expect(visibleMenuCount(menus, value)).toEqual({ visible: 1, total: 3 });

      const group = setMenuChecked(objects, menus, value, 'main', true);
      expect(group.value).toEqual({
        menus: ['contracts-page', 'payments-page'],
        grants: {},
      });
      expect(menuCheckState(menus[0]!, group.value)).toBe('checked');
      const cleared = setMenuChecked(
        objects,
        menus,
        group.value,
        'contracts-page',
        false,
      );
      // Clearing a menu never touches what the role may do with the objects its page uses.
      expect(cleared.value).toEqual({ menus: ['payments-page'], grants: {} });
      const withGrants: PermissionValue = {
        menus: ['payments-page'],
        grants: { 'contracts.view': {} },
      };
      expect(
        setMenuChecked(objects, menus, withGrants, 'payments-page', false).value
          .grants,
      ).toBe(withGrants.grants);
    });

    it('turns the action a menu opens with on and off, asking first what goes with it', () => {
      const value: PermissionValue = { menus: [], grants: {} };
      const on = setMenuChecked(objects, menus, value, 'shipments-page', true);
      expect(Object.keys(on.value.grants)).toEqual(['shipments.view']);
      expect(menuCheckState(menus[1]!, on.value)).toBe('checked');
      const withSign: PermissionValue = {
        menus: [],
        grants: { ...on.value.grants, 'shipments.sign': {} },
      };
      expect(
        menuDependents(objects, menus, withSign, 'shipments-page').map(
          (action) => action.id,
        ),
      ).toEqual(['shipments.sign']);
      expect(
        setMenuChecked(objects, menus, withSign, 'admin', false).value.grants,
      ).toEqual({});
    });

    it('warns about checked menus whose page lists an object the role cannot view', () => {
      const value: PermissionValue = {
        menus: ['contracts-page', 'payments-page'],
        grants: { 'contracts.view': {} },
      };
      const warnings = menuWarnings(menus, objects, value);
      // Payments has no View permission; a related object never warns.
      expect(
        warnings.map((warning) => [warning.menu.id, warning.object.id]),
      ).toEqual([['payments-page', 'payments']]);
      expect(warnings[0]!.action.id).toBe('payments.view');
      expect(
        menuWarnings(menus, objects, { ...value, menus: ['contracts-page'] }),
      ).toEqual([]);
      expect(menusUsing(menus, 'contracts').map((menu) => menu.id)).toEqual([
        'contracts-page',
        'payments-page',
      ]);
    });
  });

  it('ignores a View action without its own grant', () => {
    expect(view.view).toBe(true);
    expect(
      setScopeValue(objects, {}, 'contracts.view', 'records', 'own').grants,
    ).toEqual({});
  });
});
