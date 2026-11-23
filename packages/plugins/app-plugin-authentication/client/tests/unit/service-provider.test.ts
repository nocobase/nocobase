import type { ClientApplication } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticationServiceProvider } from '../../service-provider.js';
import {
  authenticationClientSettingsToken,
  authenticationClientToken,
} from '../../tokens.js';

const createAuthClient = vi.hoisted(() =>
  vi.fn(() => ({ kind: 'auth-client' })),
);
vi.mock('../../auth-client.js', () => ({ createAuthClient }));

describe('AuthenticationServiceProvider', () => {
  it('registers a client using the configured API URL', async () => {
    const factories = new Map<unknown, () => unknown>();
    const singleton = vi.fn((token: unknown, factory: () => unknown) => {
      factories.set(token, factory);
    });
    const app = {
      config: {
        get: (key: string) =>
          key === 'api.baseURL' ? 'https://example.com/main/api/' : undefined,
      },
      container: { singleton },
    } as unknown as ClientApplication;
    await new AuthenticationServiceProvider(app, {
      packageName: '@nocobase/app-plugin-authentication',
      source: 'plugin',
      options: { signInButtons: ['github'] },
    }).boot();
    expect([...factories.keys()]).toEqual([
      authenticationClientSettingsToken,
      authenticationClientToken,
    ]);
    expect(factories.get(authenticationClientSettingsToken)?.()).toEqual({
      signInButtons: ['github'],
    });
    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'https://example.com/main/api/auth',
    });
    expect(factories.get(authenticationClientToken)?.()).toEqual({
      kind: 'auth-client',
    });
  });
});
