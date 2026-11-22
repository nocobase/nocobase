import { describe, expect, it } from 'vitest';

import {
  applyQuickSetMany,
  enableDefaults,
  quickSelection,
  quickSetLevel,
  quickSetManyRemovals,
  permissionChanges,
  setSettingsLevel,
  settingsLevel,
  type PermissionObject,
  type PermissionSettingsPage,
} from '../../client/components/permission-editor-model.js';

const customers: PermissionObject = {
  id: 'customers',
  label: 'Customers',
  actions: [
    {
      id: 'customers.view',
      label: 'View',
      view: true,
      scopes: [
        {
          id: 'records',
          options: [
            { value: 'all', label: 'All' },
            { value: 'own', label: 'Own' },
          ],
          defaultValue: 'own',
        },
      ],
    },
    { id: 'customers.export', label: 'Export', risk: 'sensitive' },
  ],
};
const roles: PermissionObject = {
  id: 'roles',
  label: 'Roles',
  actions: [
    { id: 'roles.read', label: 'Read roles', view: true },
    {
      id: 'roles.update',
      label: 'Change roles',
      risk: 'high',
      requires: ['roles.read'],
    },
  ],
};
const page: PermissionSettingsPage = {
  id: 'permissions',
  label: 'Roles and permissions',
  objects: [roles],
};
const all = [customers, roles];

describe('permission editor rules', () => {
  it('turns on the defaults a page declares at their default scope, but never a risky one', () => {
    const change = enableDefaults(all, {}, [
      'customers.view',
      'customers.export',
    ]);
    expect(change.added).toEqual(['customers.view']);
    // No chosen scope: the action uses its slot's default.
    expect(change.grants).toEqual({ 'customers.view': {} });
  });

  it('sets several objects at once with one quick setting and reads which setting each matches', () => {
    const notes: PermissionObject = {
      id: 'notes',
      label: 'Notes',
      actions: [
        { id: 'notes.view', label: 'View', view: true },
        { id: 'notes.edit', label: 'Edit', requires: ['customers.view'] },
      ],
    };
    const objects = [customers, notes];
    expect(quickSetLevel(customers, {})).toBe('none');
    // All leaves risky operations off, so a sensitive Export does not stop the object reading as All.
    const everything = applyQuickSetMany(objects, {}, objects, 'all').grants;
    expect(Object.keys(everything).sort()).toEqual([
      'customers.view',
      'notes.edit',
      'notes.view',
    ]);
    expect(quickSetLevel(customers, everything)).toBe('view');
    expect(quickSetLevel(notes, everything)).toBe('all');
    expect(
      quickSetLevel(notes, { 'notes.edit': {}, 'customers.view': {} }),
    ).toBe('custom');
    // Turning Customers off also turns off Notes' Edit, which needs it: the caller asks first.
    expect(
      quickSetManyRemovals(objects, everything, [customers], 'none').map(
        (action) => action.id,
      ),
    ).toEqual(['notes.edit']);
    expect(quickSetManyRemovals(objects, everything, objects, 'none')).toEqual(
      [],
    );
    expect(
      applyQuickSetMany(objects, everything, objects, 'view').grants,
    ).toEqual({
      'customers.view': {},
      'notes.view': {},
    });
  });

  it('reads the checkbox of objects as all while every action but risky ones is on', () => {
    const notes: PermissionObject = {
      id: 'notes',
      label: 'Notes',
      actions: [{ id: 'notes.view', label: 'View', view: true }],
    };
    expect(quickSelection([customers, notes], {})).toBe('none');
    // A sensitive Export left off does not keep Customers from reading as all.
    expect(quickSelection([customers], { 'customers.view': {} })).toBe('all');
    expect(quickSelection([customers, notes], { 'customers.view': {} })).toBe(
      'some',
    );
    expect(
      quickSelection([customers, notes], {
        'customers.view': {},
        'notes.view': {},
      }),
    ).toBe('all');
    // Roles' high-risk change is left off, so its read alone is all.
    expect(quickSelection([roles], { 'roles.read': {} })).toBe('all');
    // An object with nothing Enable all turns on never reads as all.
    const risky: PermissionObject = {
      id: 'purge',
      label: 'Purge',
      actions: [{ id: 'purge.run', label: 'Run', risk: 'high' }],
    };
    expect(quickSelection([risky], { 'purge.run': {} })).toBe('some');
  });

  it('sets a settings page to none, view or manage, risky actions included in manage', () => {
    expect(settingsLevel(page, {})).toBe('none');
    const manage = setSettingsLevel(all, {}, page, 'manage').grants;
    expect(Object.keys(manage).sort()).toEqual(['roles.read', 'roles.update']);
    expect(settingsLevel(page, manage)).toBe('manage');
    const view = setSettingsLevel(all, manage, page, 'view').grants;
    expect(Object.keys(view)).toEqual(['roles.read']);
    expect(settingsLevel(page, view)).toBe('view');
    expect(setSettingsLevel(all, view, page, 'none').grants).toEqual({});
  });

  it('lists the pages, operations and scopes that changed, marking risky grants but not risky removals', () => {
    const changes = permissionChanges(
      {
        menus: ['reports'],
        grants: {
          'customers.view': { scopes: { records: 'own' } },
          'roles.update': {},
          'roles.read': {},
        },
      },
      {
        menus: ['crm'],
        grants: {
          'customers.view': { scopes: { records: 'all' } },
          'customers.export': {},
          'roles.read': {},
        },
      },
      [
        { id: 'crm', label: 'CRM' },
        { id: 'reports', label: 'Reports' },
      ],
      [customers],
      [page],
    );
    expect(changes).toEqual([
      { tab: 'menus', kind: 'added', label: 'CRM' },
      { tab: 'menus', kind: 'removed', label: 'Reports' },
      { tab: 'objects', kind: 'scope', label: 'View', owner: 'Customers' },
      {
        tab: 'objects',
        kind: 'added',
        label: 'Export',
        owner: 'Customers',
        risk: 'sensitive',
      },
      {
        tab: 'settings',
        kind: 'removed',
        label: 'Change roles',
        owner: 'Roles and permissions',
      },
    ]);
  });
});
