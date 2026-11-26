import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import authentication from '../../plugin.js';
import {
  ACCOUNT_SECURITY_ROUTE_ID,
  AUTHENTICATION_PASSKEY_GUIDE_ROUTE_ID,
  AUTHENTICATION_SETTINGS_ROUTE_ID,
  AUTHENTICATION_SSO_GUIDE_ROUTE_ID,
  AUTHENTICATION_TWO_FACTOR_GUIDE_ROUTE_ID,
} from '../../routes.js';

const componentLoader = async () => ({ default: () => null });

function flatten(
  routes: ReturnType<typeof resolveAppClientContributions>['routes'],
): ReturnType<typeof resolveAppClientContributions>['routes'] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

describe('the settings pages the authentication plugin registers', () => {
  const registration = authentication();
  const routes = flatten(
    resolveAppClientContributions([
      {
        packageName: registration.packageName,
        source: 'plugin',
        routes: registration.routes,
      },
    ]).routes,
  );
  const byId = (id: string) => routes.find((route) => route.id === id);

  it('puts Authentication in System settings › Accounts, behind its settings item', () => {
    expect(byId(AUTHENTICATION_SETTINGS_ROUTE_ID)).toMatchObject({
      path: '/settings/authentication',
      surface: 'systemSettings',
      authz: {
        resource: { type: 'settings', id: 'authentication.settings' },
        action: 'read',
      },
      navigation: { title: 'settings.title' },
    });
    expect(byId(AUTHENTICATION_SSO_GUIDE_ROUTE_ID)).toMatchObject({
      path: '/settings/authentication/sso',
      authz: {
        resource: { type: 'settings', id: 'authentication.settings' },
        action: 'read',
      },
    });
    expect(byId(AUTHENTICATION_SSO_GUIDE_ROUTE_ID)?.navigation).toBeUndefined();
    // One route serves single sign-on and social sign-in, so its breadcrumb names both.
    expect(byId(AUTHENTICATION_SSO_GUIDE_ROUTE_ID)?.breadcrumb).toEqual({
      title: 'sso.breadcrumb',
    });
  });

  it('puts the two-factor and passkey guides beside it, behind the same settings item and out of the menu', async () => {
    for (const [id, path, title] of [
      [
        AUTHENTICATION_TWO_FACTOR_GUIDE_ROUTE_ID,
        '/settings/authentication/two-factor',
        'guide.twoFactor.title',
      ],
      [
        AUTHENTICATION_PASSKEY_GUIDE_ROUTE_ID,
        '/settings/authentication/passkey',
        'guide.passkey.title',
      ],
    ] as const) {
      const route = byId(id);
      expect(route).toMatchObject({
        path,
        authz: {
          resource: { type: 'settings', id: 'authentication.settings' },
          action: 'read',
        },
        breadcrumb: { title },
      });
      expect(route?.navigation).toBeUndefined();
      expect((await route?.componentLoader?.())?.default).toEqual(
        expect.any(Function),
      );
    }
  });

  it('puts Account and security in Personal settings › Account, open to every signed-in person', () => {
    expect(byId(ACCOUNT_SECURITY_ROUTE_ID)).toMatchObject({
      path: '/me/security',
      surface: 'personalSettings',
      auth: 'required',
      authz: 'skip',
    });
  });

  it('replaces either page through its options, and nothing without them', () => {
    expect(registration.routeComponentOverrides).toEqual([]);
    expect(
      authentication({
        settingsComponentLoader: componentLoader,
        accountSecurityComponentLoader: componentLoader,
      }).routeComponentOverrides.map((override) => override.routeId),
    ).toEqual([AUTHENTICATION_SETTINGS_ROUTE_ID, ACCOUNT_SECURITY_ROUTE_ID]);
  });
});
