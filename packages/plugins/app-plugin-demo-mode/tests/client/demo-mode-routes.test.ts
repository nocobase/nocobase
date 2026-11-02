import {
  defineAppRoutes,
  resolveAppClientContributions,
} from '@nocobase/app-client/plugins';
import { afterEach, expect, it } from 'vitest';

import { demoModeRoutes } from '../../client/index.js';

afterEach(() => {
  document.getElementById('nocobase-runtime-config')?.remove();
});

it.each([
  { publicConfig: undefined, expectedPaths: ['/profile'] },
  { publicConfig: {}, expectedPaths: ['/profile'] },
  {
    publicConfig: { demoMode: { enabled: false } },
    expectedPaths: ['/profile'],
  },
  {
    publicConfig: { demoMode: { enabled: true } },
    expectedPaths: ['/profile', '/demo-data'],
  },
])(
  'registers demo navigation only when enabled: $publicConfig',
  ({ publicConfig, expectedPaths }) => {
    if (publicConfig !== undefined) {
      const script = document.createElement('script');
      script.id = 'nocobase-runtime-config';
      script.type = 'application/json';
      script.textContent = JSON.stringify({
        version: 1,
        config: {},
        public: publicConfig,
      });
      document.head.append(script);
    }
    const componentLoader = async () => ({ default: () => null });
    const { routes } = resolveAppClientContributions([
      {
        packageName: '@example/app',
        source: 'application',
        routes: defineAppRoutes([
          {
            name: 'settings',
            navigation: { title: 'settings' },
            children: [
              {
                name: 'profile',
                path: '/profile',
                authz: 'skip',
                componentLoader,
              },
              ...demoModeRoutes([
                {
                  name: 'demo',
                  path: '/demo-data',
                  navigation: { title: 'demo' },
                  authz: {
                    resource: { type: 'settings', id: 'demoMode.data' },
                    action: 'read',
                  },
                  componentLoader,
                },
              ]),
            ],
          },
        ]),
      },
    ]);
    expect(routes[0]?.children?.map((route) => route.path)).toEqual(
      expectedPaths,
    );
    if (expectedPaths.includes('/demo-data')) {
      expect(routes[0]?.children?.[1]).toMatchObject({
        navigation: { title: 'demo' },
        authz: {
          resource: { type: 'settings', id: 'demoMode.data' },
          action: 'read',
        },
      });
    }
  },
);
