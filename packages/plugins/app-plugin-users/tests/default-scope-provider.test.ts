import {
  ApplicationMailer,
  applicationMailerToken,
} from '@nocobase/app-server/mailers';
import { expect, it } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  authorizationToken,
  createAppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { UsersProvider } from '../server/providers/users.js';
import { userRoleScopeRegistryToken } from '../server/tokens.js';

it.each([true, false])(
  'registers the default scope only when enabled: %s',
  async (enabled) => {
    const container = new ServiceContainer();
    container.instance(applicationMailerToken, new ApplicationMailer());
    container.instance(authorizationToken, createAppAuthorization({}));
    const provider = new UsersProvider({
      container,
      config: { get: () => ({ permissionSets: enabled }) },
    } as unknown as AppPluginApplication);
    provider.register();
    await provider.boot();
    await provider.boot();
    expect(
      container
        .resolve(userRoleScopeRegistryToken)
        .list()
        .map((scope) => scope.key),
    ).toEqual(enabled ? ['app'] : []);
    await provider.shutdown();
    expect(container.resolve(userRoleScopeRegistryToken).list()).toEqual([]);
  },
);
