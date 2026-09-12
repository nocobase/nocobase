/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginAuthClient from '../index';

vi.mock('@nocobase/client', () => ({
  Plugin: class {
    app: { router: unknown };
    router: unknown;

    constructor(_options: unknown, app: { router: unknown }) {
      this.app = app;
      this.router = app.router;
    }
  },
  lazy: (_loader: () => Promise<unknown>, ...names: string[]) =>
    names.reduce<Record<string, string>>((components, name) => {
      components[name] = name;
      return components;
    }, {}),
}));

vi.mock('@nocobase/utils/client', () => ({
  Registry: class {
    register = vi.fn();
  },
}));

vi.mock('../interceptors', () => ({
  authCheckMiddleware: vi.fn(() => [vi.fn(), vi.fn()]),
}));

describe('PluginAuthClient routes', () => {
  it('should skip auth check for v1 public auth pages without silencing signin errors', async () => {
    const app = {
      router: {
        add: vi.fn(),
      },
      pluginSettingsManager: {
        add: vi.fn(),
      },
      addComponents: vi.fn(),
      providers: {
        unshift: vi.fn(),
      },
      apiClient: {
        axios: {
          interceptors: {
            response: {
              handlers: {
                unshift: vi.fn(),
              },
            },
          },
        },
      },
    };

    const plugin = new PluginAuthClient({}, app as ConstructorParameters<typeof PluginAuthClient>[1]);

    await plugin.load();

    const getRouteOptions = (routeName: string) => {
      const matchingCall = app.router.add.mock.calls.find(([name]) => name === routeName) as
        | [string, { path?: string; skipAuthCheck?: boolean }]
        | undefined;
      expect(matchingCall).toBeDefined();
      return matchingCall?.[1];
    };

    expect(getRouteOptions('auth.signin')).toEqual(expect.objectContaining({ path: '/signin' }));
    expect(getRouteOptions('auth.signin')).not.toHaveProperty('skipAuthCheck', true);
    expect(getRouteOptions('auth.signup')).toEqual(expect.objectContaining({ path: '/signup', skipAuthCheck: true }));
    expect(getRouteOptions('auth.forgotPassword')).toEqual(
      expect.objectContaining({ path: '/forgot-password', skipAuthCheck: true }),
    );
    expect(getRouteOptions('auth.resetPassword')).toEqual(
      expect.objectContaining({ path: '/reset-password', skipAuthCheck: true }),
    );
  });
});
