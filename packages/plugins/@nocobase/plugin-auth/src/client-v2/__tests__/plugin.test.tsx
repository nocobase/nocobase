/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginAuthClientV2 from '../plugin';

describe('plugin-auth client-v2', () => {
  const originalLocation = globalThis.window.location;

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('should redirect runtime 401 to legacy signin with replace', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/admin/7vu4c2sdk6h',
        search: '?tab=overview',
        hash: '#panel',
        replace,
      },
    });

    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginAuthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/7vu4c2sdk6h?tab=overview#panel'] },
    });
    await app.load();
    app.router.router = {
      basename: '/v2',
      state: {
        location: {
          pathname: '/v2/admin/7vu4c2sdk6h',
          search: '?tab=overview',
          hash: '#panel',
        },
      },
    } as any;

    const error = {
      response: {
        status: 401,
        data: {
          errors: [{ code: 'EXPIRED_SESSION' }],
        },
      },
      config: {},
    } as any;

    // @ts-ignore
    app.apiClient.axios.interceptors.response.handlers[0].rejected(error);

    await vi.waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h%3Ftab%3Doverview%23panel');
    });
  });

  it('should not redirect skipped auth routes on runtime 401', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/signin',
        search: '',
        hash: '',
        replace,
      },
    });

    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [PluginAuthClientV2 as any],
      router: { type: 'memory', initialEntries: ['/v2/signin'] },
    });
    await app.load();
    app.router.router = {
      basename: '/v2',
      state: {
        location: {
          pathname: '/v2/signin',
          search: '',
          hash: '',
        },
      },
    } as any;

    const error = {
      response: {
        status: 401,
        data: {
          errors: [{ code: 'EXPIRED_SESSION' }],
        },
      },
      config: {},
    } as any;

    try {
      // @ts-ignore
      await app.apiClient.axios.interceptors.response.handlers[0].rejected(error);
      throw new Error('expected interceptor to throw');
    } catch (thrownError) {
      expect(thrownError).toBe(error);
    }
    expect(replace).not.toHaveBeenCalled();
  });
});
