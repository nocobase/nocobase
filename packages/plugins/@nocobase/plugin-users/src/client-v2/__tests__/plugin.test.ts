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

  it('should use same-origin legacy signin redirect returned by server', async () => {
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

    const SignOutItemModel = app.flowEngine.getModelClass('SignOutItemModel') as any;
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

  it('should ignore v2 signin redirect returned by server and fallback to legacy signin', async () => {
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
      '/nocobase/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2F7vu4c2sdk6h%3Ftab%3Doverview%23panel',
    );
  });
});
