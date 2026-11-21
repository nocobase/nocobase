import { describe, expect, it } from 'vitest';

import routes, { settingsRoutes } from '../../client/routes.js';

describe('client routes', () => {
  // Loading a page module transforms its whole import graph on first use, which can outlast the default 5 s timeout
  // when a release runner runs every package's tests at once.
  it('defines the App Route through one Client entry', async () => {
    expect(routes.parent).toBe('app');
    const [appRoute] = routes.routes;

    expect(appRoute).toMatchObject({
      name: 'index',
      path: '/routes-example',
      auth: 'required',
      authz: { resource: { type: 'page', id: 'index' }, action: 'access' },
      componentLoader: expect.any(Function),
    });
    await expect(appRoute?.componentLoader?.()).resolves.toHaveProperty(
      'default',
    );
  }, 30_000);
});

describe('client settings routes', () => {
  it('contributes a settings page to the System category', async () => {
    expect(settingsRoutes.parent).toBe('systemSettings');
    const [page] = settingsRoutes.routes;
    expect(page).toMatchObject({
      parent: 'system',
      name: 'exampleSettings',
      path: '/routes-example',
      navigation: { title: 'settingsTitle' },
    });
    expect(page).not.toHaveProperty('authz');
    await expect(page?.componentLoader?.()).resolves.toHaveProperty('default');
  }, 30_000);
});
