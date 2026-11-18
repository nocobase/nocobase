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
        ],
      },
    ],
  },
];

const contracts = modules[1]!.menus[0]!;
const view = contracts.actions[2]!;
const update = contracts.actions[1]!;
const updateSlot = update.scopes![0]!;

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
    const change = setScopeValue(
      modules,
      grants,
      'contracts.view',
      'records',
      'department',
    );
    expect(change.grants['contracts.update']?.scopes).toEqual({});
    expect(change.grants['contracts.archive']?.scopes).toEqual({
      records: 'own',
    });
    expect(change.notices).toEqual([
      { kind: 'scope-reset', view: 'Their department', actions: ['Edit'] },
    ]);
    expect(
      effectiveScopeValue(contracts, change.grants, update, updateSlot),
    ).toBe('department');
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

  it('never turns on a risky action automatically', () => {
    const on = setActionEnabled(modules, {}, 'payments.refund', true);
    expect(on.grants['payments.secret']).toBeUndefined();
    expect(on.notices).toEqual([
      { kind: 'risky-requirement', actions: ['Bank details'] },
    ]);
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
    expect(visibleMenuCount(modules, grants)).toEqual({ visible: 1, total: 2 });
    expect(visibleMenuCount(modules, {})).toEqual({ visible: 0, total: 2 });
    expect(nextMenu(modules, 'contracts')?.id).toBe('payments');
    expect(nextMenu(modules, 'payments')).toBeUndefined();
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
