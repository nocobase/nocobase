import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import routes from '../../client/routes.js';

describe('Mail client routes', () => {
  it('contributes lazy Settings and development routes without an application page', async () => {
    expect(routes).toHaveLength(2);
    const [settings, dev] = routes;
    expect(settings).toMatchObject({
      parent: 'settings',
      routes: [
        {
          name: 'mail',
          path: '/mail',
          navigation: { title: 'nav.settings' },
          children: [
            {
              name: 'accounts',
              path: '/accounts',
              navigation: { title: 'nav.accounts' },
              authz: {
                resource: { type: 'page', id: 'mail.admin' },
                action: 'access',
              },
              componentLoader: expect.any(Function),
            },
          ],
        },
      ],
    });
    expect(dev).toMatchObject({
      parent: 'dev',
      routes: [
        {
          name: 'mail',
          path: '/mail',
          navigation: { title: 'nav.dev' },
          children: [
            {
              name: 'accounts',
              path: '/accounts',
              navigation: { title: 'nav.devAccounts' },
              authz: {
                resource: { type: 'page', id: 'mail.workspace' },
                action: 'access',
              },
              componentLoader: expect.any(Function),
            },
            {
              name: 'center',
              path: '/center',
              navigation: { title: 'nav.devCenter' },
              authz: {
                resource: { type: 'page', id: 'mail.workspace' },
                action: 'access',
              },
              componentLoader: expect.any(Function),
            },
            {
              name: 'management',
              path: '/management',
              navigation: { title: 'nav.devManagement' },
              authz: {
                resource: { type: 'page', id: 'mail.management' },
                action: 'access',
              },
              componentLoader: expect.any(Function),
            },
            {
              name: 'send',
              path: '/send',
              navigation: { title: 'nav.devSend' },
              authz: {
                resource: { type: 'page', id: 'mail.workspace' },
                action: 'access',
              },
              componentLoader: expect.any(Function),
            },
            {
              name: 'logs',
              path: '/logs',
              navigation: { title: 'nav.devLogs' },
              authz: {
                resource: { type: 'page', id: 'mail.workspace' },
                action: 'access',
              },
              children: [
                { name: 'send', path: 'send' },
                { name: 'bulk', path: 'bulk' },
                { name: 'sync', path: 'sync' },
              ],
            },
            { name: 'bulk-send', path: '/bulk-send' },
            { name: 'sync-logs', path: '/sync-logs' },
            { name: 'send-logs', path: '/send-logs' },
          ],
        },
      ],
    });

    if (settings?.parent !== 'settings') {
      throw new Error('Missing Mail Settings route contribution.');
    }
    if (dev?.parent !== 'dev') {
      throw new Error('Missing Mail client route contribution.');
    }
    await expect(
      settings.routes[0]?.children?.[0]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(
      dev.routes[0]?.children?.[0]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(
      dev.routes[0]?.children?.[1]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(
      dev.routes[0]?.children?.[2]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(
      dev.routes[0]?.children?.[3]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(
      dev.routes[0]?.children?.[4]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(
      dev.routes[0]?.children?.[5]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });
    await expect(
      dev.routes[0]?.children?.[6]?.componentLoader(),
    ).resolves.toMatchObject({ default: expect.any(Function) });

    expect(
      dev.routes[0]?.children
        ?.filter((route) => route.navigation)
        .map((route) => route.path),
    ).toEqual(['/accounts', '/center', '/management', '/send', '/logs']);
    expect(dev.routes[0]?.children?.[3]?.children).toMatchObject([
      { name: 'compose', path: 'compose' },
      { name: 'bulk', path: 'bulk' },
    ]);

    const resolved = resolveAppClientContributions([
      { packageName: '@nocobase/app-plugin-mail', routes },
    ]);
    expect(resolved.routes).toEqual([]);
    expect(resolved.settingGroups).toMatchObject([
      { id: 'mail', title: 'nav.settings' },
    ]);
    expect(resolved.settings.map((route) => route.path)).toEqual([
      '/settings/mail/accounts',
    ]);
    expect(resolved.devRoutes.map((route) => route.path)).toEqual([
      '/dev/mail/accounts',
      '/dev/mail/center',
      '/dev/mail/management',
      '/dev/mail/send',
      '/dev/mail/send/compose',
      '/dev/mail/send/bulk',
      '/dev/mail/logs',
      '/dev/mail/logs/send',
      '/dev/mail/logs/bulk',
      '/dev/mail/logs/sync',
      '/dev/mail/bulk-send',
      '/dev/mail/sync-logs',
      '/dev/mail/send-logs',
    ]);
  });
});
