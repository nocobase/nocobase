/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/actions', () => ({}));
vi.mock('@nocobase/acl', () => ({
  NoPermissionError: class NoPermissionError extends Error {},
  checkFilterParams: vi.fn(),
  createUserProvider: vi.fn(() => ({})),
  parseJsonTemplate: vi.fn(async (value) => value),
}));

import { checkChangesWithAssociation } from '../middlewares/check-change-with-association';

function createContext(
  actionName: 'create' | 'firstOrCreate' | 'updateOrCreate' | 'update',
  children: unknown[],
  updateAssociationValues?: string[],
) {
  const itemCollection = {
    model: { primaryKeyAttribute: 'id' },
    getField: vi.fn(),
  };
  const childCollection = {
    model: { primaryKeyAttribute: 'id' },
    getField: vi.fn((name: string) =>
      name === 'items' ? { type: 'hasMany', target: 'items', targetKey: 'id' } : undefined,
    ),
    db: {
      getCollection: vi.fn((name: string) => (name === 'items' ? itemCollection : undefined)),
    },
  };
  const parentCollection = {
    getField: vi.fn((name: string) =>
      name === 'children' ? { type: 'hasMany', target: 'children', targetKey: 'id' } : undefined,
    ),
    db: {
      getCollection: vi.fn((name: string) => (name === 'children' ? childCollection : undefined)),
    },
  };

  return {
    acl: {
      getRole: vi.fn(() => ({ snippetAllowed: vi.fn(() => false) })),
      can: vi.fn(({ resource, action }) =>
        ['children', 'items'].includes(resource) && action === 'create' ? { params: {} } : null,
      ),
    },
    action: {
      resourceName: 'parents',
      actionName,
      params: {
        values: {
          title: 'parent',
          children,
        },
        updateAssociationValues,
      },
    },
    app: { dataSourceManager: {} },
    database: { getCollection: vi.fn(() => parentCollection) },
    permission: { can: { params: {} } },
    request: { get: vi.fn() },
    state: {
      currentRole: 'admin',
      currentRoles: ['admin'],
      currentUser: {},
    },
  };
}

describe('checkChangesWithAssociation', () => {
  it('keeps permitted nested values when create omits updateAssociationValues', async () => {
    const ctx = createContext('create', [
      {
        title: 'new child',
        items: [{ title: 'new item' }],
      },
    ]);

    await checkChangesWithAssociation(ctx as never, async () => {});

    expect(ctx.action.params.values.children).toEqual([
      {
        title: 'new child',
        items: [{ title: 'new item' }],
      },
    ]);
  });

  it('does not change update behavior or scalar association keys', async () => {
    const updateCtx = createContext('update', [{ title: 'new child' }]);
    const createCtx = createContext('create', [1]);

    await checkChangesWithAssociation(updateCtx as never, async () => {});
    await checkChangesWithAssociation(createCtx as never, async () => {});

    expect(updateCtx.action.params.values.children).toEqual([]);
    expect(createCtx.action.params.values.children).toEqual([1]);
  });

  it('preserves explicit empty updateAssociationValues and mixed association keys', async () => {
    const explicitEmptyCtx = createContext('create', [{ title: 'new child' }], []);
    const mixedCtx = createContext('create', [1, { title: 'new child' }]);

    await checkChangesWithAssociation(explicitEmptyCtx as never, async () => {});
    await checkChangesWithAssociation(mixedCtx as never, async () => {});

    expect(explicitEmptyCtx.action.params.values.children).toEqual([]);
    expect(mixedCtx.action.params.values.children).toEqual([1, { title: 'new child' }]);
  });

  it.each(['firstOrCreate', 'updateOrCreate'] as const)(
    'does not infer association paths for %s',
    async (actionName) => {
      const ctx = createContext(actionName, [{ title: 'new child' }]);

      await checkChangesWithAssociation(ctx as never, async () => {});

      expect(ctx.action.params.values.children).toEqual([]);
    },
  );

  it('still enforces target collection create permissions', async () => {
    const ctx = createContext('create', [1, { title: 'new child' }]);
    ctx.acl.can.mockReturnValue(null);

    await checkChangesWithAssociation(ctx as never, async () => {});

    expect(ctx.action.params.values.children).toEqual([1]);
  });

  it('still enforces nested target collection create permissions', async () => {
    const ctx = createContext('create', [
      {
        title: 'new child',
        items: [{ title: 'new item' }],
      },
    ]);
    ctx.acl.can.mockImplementation(({ resource, action }) =>
      resource === 'children' && action === 'create' ? { params: {} } : null,
    );

    await checkChangesWithAssociation(ctx as never, async () => {});

    expect(ctx.action.params.values.children).toEqual([
      {
        title: 'new child',
        items: [],
      },
    ]);
  });

  it('does not recurse forever when internal callers pass cyclic values', async () => {
    const collection = {
      model: { primaryKeyAttribute: 'id' },
      getField: vi.fn(() => ({ type: 'hasOne', target: 'parents', targetKey: 'id' })),
      db: {
        getCollection: vi.fn(),
      },
    };
    collection.db.getCollection.mockReturnValue(collection);
    const values: Record<string, unknown> = {};
    values.parent = values;
    const ctx = {
      acl: {
        getRole: vi.fn(() => ({ snippetAllowed: vi.fn(() => false) })),
        can: vi.fn(() => ({ params: {} })),
      },
      action: {
        resourceName: 'parents',
        actionName: 'create',
        params: { values },
      },
      app: { dataSourceManager: {} },
      database: { getCollection: vi.fn(() => collection) },
      permission: { can: { params: {} } },
      request: { get: vi.fn() },
      state: { currentRole: 'admin', currentRoles: ['admin'], currentUser: {} },
    };

    await expect(checkChangesWithAssociation(ctx as never, async () => {})).resolves.toBeUndefined();
  });
});
