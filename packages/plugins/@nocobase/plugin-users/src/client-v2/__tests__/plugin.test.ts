/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
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
