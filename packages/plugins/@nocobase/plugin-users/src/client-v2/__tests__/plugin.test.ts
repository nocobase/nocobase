/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginAclClientV2 from '@nocobase/plugin-acl/client-v2';
import PluginUsersClientV2 from '../plugin';

describe('plugin-users client-v2', () => {
  const originalLocation = globalThis.window.location;

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('should not register user form models as global model loaders', async () => {
    const app = createMockClient({ publicPath: '/v2/' });
    const registerModelLoaders = vi.spyOn(app.flowEngine, 'registerModelLoaders');

    await app.pm.add(PluginUsersClientV2);
    await app.load();

    const registeredLoaders = Object.assign(
      {},
      ...registerModelLoaders.mock.calls.map(([loaders]) => loaders as Record<string, unknown>),
    );
    expect(registeredLoaders).not.toHaveProperty('UserCreateFormModel');
    expect(registeredLoaders).not.toHaveProperty('UserEditFormModel');
  });

  it('registers settings menu, users tab, settings link, and user center model loaders in the real client runtime', async () => {
    const app = createMockClient({ publicPath: '/v2/' });

    await app.pm.add(PluginUsersClientV2);
    await app.load();

    expect(app.pluginSettingsManager.get('users-permissions')).toMatchObject({
      title: 'Users & Permissions',
      isPinned: true,
      sort: 200,
      showTabs: true,
    });
    expect(app.pluginSettingsManager.get('users-permissions.users')).toMatchObject({
      title: 'Users',
      aclSnippet: 'pm.users',
      sort: 2,
    });
    expect(app.pluginSettingsManager.getPluginSettingsName('users')).toBe('users-permissions.users');
    expect(app.pluginSettingsManager.getPluginSettingsRoutePath('users')).toBe(
      '/admin/settings/users-permissions/users',
    );

    await expect(app.flowEngine.getModelClassAsync('EditProfileItemModel')).resolves.toBeTruthy();
    await expect(app.flowEngine.getModelClassAsync('ChangePasswordItemModel')).resolves.toBeTruthy();
    await expect(app.flowEngine.getModelClassAsync('CurrentUserSummaryItemModel')).resolves.toBeTruthy();
    await expect(app.flowEngine.getModelClassAsync('SignOutItemModel')).resolves.toBeTruthy();
    await expect(app.flowEngine.getModelClassAsync('UserPasswordFieldModel')).resolves.toBeTruthy();
    await expect(app.flowEngine.getModelClassAsync('UserRolesSelectFieldModel')).resolves.toBeTruthy();
  });

  it('registers the users role tab when the ACL plugin is loaded', async () => {
    const app = createMockClient({ publicPath: '/v2/' });

    await app.pm.add(PluginAclClientV2);
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    const aclPlugin = app.pm.get(PluginAclClientV2) as PluginAclClientV2;
    const usersRoleTab = aclPlugin.rolesManager.list().find(([key]) => key === 'users');

    expect(usersRoleTab).toBeTruthy();
    expect(usersRoleTab?.[1]).toMatchObject({
      title: 'Users',
      sort: 10,
    });
    await expect(usersRoleTab?.[1].componentLoader()).resolves.toHaveProperty('default');
  });

  it('should use same-origin signin redirect returned by server when whitelisted', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'http://localhost:20000',
        pathname: '/v2/admin/7vu4c2sdk6h',
        search: '?tab=overview',
        hash: '#panel',
        replace,
      },
    });

    const app = createMockClient({ publicPath: '/v2/' });
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    const SignOutItemModel = await app.flowEngine.getModelClassAsync('SignOutItemModel');
    const model = app.flowEngine.createModel({ use: 'SignOutItemModel', uid: 'sign-out' }) as any;
    expect(SignOutItemModel).toBeTruthy();

    app.apiClient.auth.signOut = vi.fn().mockResolvedValue({
      data: {
        data: {
          redirect: '/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h#preserved',
        },
      },
    });

    await model.onClick();

    expect(replace).toHaveBeenCalledWith(
      'http://localhost:20000/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h#preserved',
    );
  });

  it('should accept server-returned v2 signin redirect under nested public path', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'http://localhost:20000',
        pathname: '/nocobase/v2/admin/7vu4c2sdk6h',
        search: '?tab=overview',
        hash: '#panel',
        replace,
      },
    });

    const app = createMockClient({ publicPath: '/nocobase/v2/' });
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    await app.flowEngine.getModelClassAsync('SignOutItemModel');
    const model = app.flowEngine.createModel({ use: 'SignOutItemModel', uid: 'sign-out' }) as any;

    app.apiClient.auth.signOut = vi.fn().mockResolvedValue({
      data: {
        data: {
          redirect: '/nocobase/v2/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2F7vu4c2sdk6h',
        },
      },
    });

    await model.onClick();

    expect(replace).toHaveBeenCalledWith(
      'http://localhost:20000/nocobase/v2/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2F7vu4c2sdk6h',
    );
  });

  it('should fallback to v2 signin when server-returned redirect is not whitelisted', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'http://localhost:20000',
        pathname: '/nocobase/v2/admin/7vu4c2sdk6h',
        search: '?tab=overview',
        hash: '#panel',
        replace,
      },
    });

    const app = createMockClient({ publicPath: '/nocobase/v2/' });
    await app.pm.add(PluginUsersClientV2);
    await app.load();

    await app.flowEngine.getModelClassAsync('SignOutItemModel');
    const model = app.flowEngine.createModel({ use: 'SignOutItemModel', uid: 'sign-out' }) as any;

    app.apiClient.auth.signOut = vi.fn().mockResolvedValue({
      data: {
        data: {
          redirect: '/nocobase/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2F7vu4c2sdk6h',
        },
      },
    });

    await model.onClick();

    expect(replace).toHaveBeenCalledWith(
      '/nocobase/v2/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2F7vu4c2sdk6h%3Ftab%3Doverview%23panel',
    );
  });
});
