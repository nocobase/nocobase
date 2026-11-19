import { renderDemo } from '../helpers/render-demo.js';
import { answerApi } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import {
  defineAppRoutes,
  defineClientPlugin,
  type AppClientRouteAuth,
} from '@nocobase/app-client/plugins';

import demoMode from '../../client/index.js';

const page = async () => ({ default: () => null });

/**
 * The default template's System settings shape: the shell, a category and a module group all register at the shell's
 * path, its home page at the path with a trailing slash, and module pages below.
 */
function shell(name: string, auth: AppClientRouteAuth) {
  return {
    name,
    path: `/${name}`,
    auth,
    navigation: { title: name },
    children: [
      { name: `${name}Home`, path: '/', componentLoader: page },
      {
        name: `${name}Category`,
        navigation: { title: 'Category' },
        children: [
          {
            name: `${name}Module`,
            navigation: { title: 'Module' },
            children: [
              { name: `${name}Roles`, path: '/roles', componentLoader: page },
            ],
          },
        ],
      },
    ],
  };
}

const business = defineClientPlugin({
  packageName: '@nocobase/test-settings',
  routes: defineAppRoutes([
    shell('settings', 'required'),
    shell('help', 'optional'),
  ]),
});

async function open(route: string, demoModeEnabled = true) {
  const calls: string[] = [];
  await renderDemo(<p>Application page</p>, {
    plugins: [demoMode(), business()],
    route,
    demoModeEnabled,
    fetch: answerApi((call) => {
      calls.push(`${call.method} ${call.path}`);
      if (call.path === 'demoMode/accounts/signInDefault')
        return { data: { signedIn: false } };
      return new Response(null, { status: 404 });
    }),
  });
  expect(await screen.findByText('Application page')).toBeVisible();
  return calls.filter(
    (call) => call === 'POST demoMode/accounts/signInDefault',
  );
}

it.each(['/settings', '/settings/', '/settings/roles'])(
  'enters an account before the required page nested in same-path groups at %s',
  async (route) => {
    expect(await open(route)).toHaveLength(1);
  },
);

it.each(['/help', '/help/roles'])(
  'opens the optional page nested in same-path groups at %s directly',
  async (route) => {
    expect(await open(route)).toHaveLength(0);
  },
);

it('renders same-path groups when Demo Mode is disabled', async () => {
  expect(await open('/settings/roles', false)).toHaveLength(0);
});
