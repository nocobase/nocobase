/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const reloadLocation = vi.hoisted(() => ({
  originalLocation: undefined as Location | undefined,
}));

vi.mock('@nocobase/client-v2', () => ({
  UserCenterSelectItemModel: class {
    options: Array<{ value: string; label: string }> = [];
    ready = true;
    value?: string;
    context: Record<string, any> = {};
  },
}));

import { SwitchRoleItemModel } from '../SwitchRoleItemModel';

function createModel(context: Record<string, any>) {
  const model = new SwitchRoleItemModel();
  model.context = context;
  return model;
}

describe('SwitchRoleItemModel', () => {
  beforeEach(() => {
    reloadLocation.originalLocation = globalThis.window.location;
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...reloadLocation.originalLocation,
        reload: vi.fn(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: reloadLocation.originalLocation,
    });
    vi.clearAllMocks();
  });

  it('builds selectable roles from the current user roles', async () => {
    const model = createModel({
      user: {
        roles: [{ name: 'admin', title: 'Admin' }, { name: 'member' }],
      },
      acl: {
        data: {
          roleMode: 'default',
        },
      },
      api: {
        auth: {
          role: 'member',
        },
      },
      t: (key: string) => key,
    });

    await model.prepare();

    expect(model.options).toEqual([
      { value: 'admin', label: 'Admin' },
      { value: 'member', label: 'member' },
    ]);
    expect(model.value).toBe('member');
    expect(model.ready).toBe(true);
  });

  it('offers the union role only when union mode allows explicit selection', async () => {
    const model = createModel({
      user: {
        roles: [{ name: 'member', title: 'Member' }],
      },
      acl: {
        data: {
          roleMode: 'allow-use-union',
        },
      },
      api: {
        auth: {},
      },
      t: (key: string, options?: Record<string, unknown>) => `${options?.ns}:${key}`,
    });

    await model.prepare();

    expect(model.options).toEqual([
      { value: '__union__', label: '@nocobase/plugin-acl:Full permissions' },
      { value: 'member', label: 'Member' },
    ]);
    expect(model.value).toBe('__union__');
    expect(model.ready).toBe(true);
  });

  it('stays hidden when only the union role may be used', async () => {
    const model = createModel({
      user: {
        roles: [
          { name: 'admin', title: 'Admin' },
          { name: 'member', title: 'Member' },
        ],
      },
      acl: {
        data: {
          roleMode: 'only-use-union',
        },
      },
      api: {
        auth: {},
      },
      t: (key: string) => key,
    });

    await model.prepare();

    expect(model.options).toEqual([
      { value: 'admin', label: 'Admin' },
      { value: 'member', label: 'Member' },
    ]);
    expect(model.ready).toBe(false);
  });

  it('persists the selected default role and reloads the page', async () => {
    const setRole = vi.fn();
    const setDefaultRole = vi.fn().mockResolvedValue(undefined);
    const model = createModel({
      api: {
        auth: {
          setRole,
        },
        resource: vi.fn(() => ({
          setDefaultRole,
        })),
      },
    });

    await model.onChange('member');

    expect(setRole).toHaveBeenCalledWith('member');
    expect(model.context.api.resource).toHaveBeenCalledWith('users');
    expect(setDefaultRole).toHaveBeenCalledWith({ values: { roleName: 'member' } });
    expect(globalThis.window.location.reload).toHaveBeenCalled();
  });
});
