import {
  applyClientRouteComponentOverrides,
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import plugin from '../../client/plugin.js';
import { PLUGINS_ACCESS } from '../../shared/access.js';

function flatten(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

function pluginRoutes(): AppClientRegisteredRoute[] {
  const registration = plugin();
  return flatten(
    resolveAppClientContributions([
      {
        packageName: registration.packageName,
        routes: registration.routes,
      },
    ]).routes,
  ).filter((route) => route.packageName === registration.packageName);
}

describe('plugins routes', () => {
  it('registers the plugins page in System settings behind «Plugins · View»', () => {
    const page = pluginRoutes().find(({ name }) => name === 'plugins');
    expect(page).toMatchObject({
      id: '@nocobase/app-plugin-foundation:plugins',
      path: '/settings/plugins',
      auth: 'required',
      authz: PLUGINS_ACCESS,
      navigation: { title: 'nav.plugins' },
    });
  });

  it.each([
    '/settings/foundation',
    '/settings/capabilities',
    '/settings/capabilities/:entryId',
  ])('sends %s to the plugins page', async (path) => {
    const route = pluginRoutes().find((item) => item.path === path);
    expect(route).toMatchObject({ authz: PLUGINS_ACCESS });
    expect(route?.navigation).toBeUndefined();
    const { default: Redirect } = await route!.componentLoader!();
    function Location() {
      const location = useLocation();
      return createElement('p', null, location.pathname + location.search);
    }
    render(
      createElement(
        MemoryRouter,
        {
          initialEntries: [path.replace(':entryId', 'users') + '?from=old'],
        },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path,
            element: createElement(Redirect),
          }),
          createElement(Route, {
            path: '/settings/plugins',
            element: createElement(Location),
          }),
        ),
      ),
    );
    expect(
      await screen.findByText('/settings/plugins?from=old'),
    ).toBeInTheDocument();
  });

  it('lets an application replace the whole page by its route id', async () => {
    const MyPlugins = () => null;
    const routes = applyClientRouteComponentOverrides(
      resolveAppClientContributions([
        {
          packageName: '@nocobase/app-plugin-foundation',
          routes: plugin().routes,
        },
      ]).routes,
      [
        {
          routeId: '@nocobase/app-plugin-foundation:plugins',
          componentLoader: async () => ({ default: MyPlugins }),
        },
      ],
    );
    const page = flatten(routes).find(({ name }) => name === 'plugins');
    expect((await page!.componentLoader!()).default).toBe(MyPlugins);
  });
});
