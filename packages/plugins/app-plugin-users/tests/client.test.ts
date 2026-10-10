import { describe, expect, it } from 'vitest';

import users from '../client/plugin.js';

describe('@nocobase/app-plugin-users Client routes', () => {
  it('serves only the invitation page, to visitors without a session', async () => {
    const registration = users();
    expect(registration.serviceProviders).toEqual([]);
    expect(registration.routes).toEqual([
      expect.objectContaining({
        parent: 'app',
        routes: [
          expect.objectContaining({
            name: 'invite',
            path: '/invite/:token',
            auth: 'optional',
            authz: 'skip',
          }),
        ],
      }),
    ]);
    await expect(
      registration.routes[0]?.routes[0]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
  }, 15_000);

  it('lets an application replace the invitation page without changing its identity', () => {
    const inviteComponentLoader = () =>
      Promise.resolve({ default: () => null as never });
    expect(users({ inviteComponentLoader }).routeComponentOverrides).toEqual([
      {
        routeId: '@nocobase/app-plugin-users:invite',
        componentLoader: inviteComponentLoader,
      },
    ]);
  });
});
