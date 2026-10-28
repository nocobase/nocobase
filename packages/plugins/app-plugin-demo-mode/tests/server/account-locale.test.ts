import { createTestApp } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';

import { createStandaloneServer } from '../helpers/minimal-app.js';

it('preserves client-owned role titles regardless of request language for listing and sign-in', async () => {
  const app = await createTestApp({
    config: { demoMode: { enabled: true } },
    createServer: createStandaloneServer,
  });
  try {
    const expected = {
      role: 'root',
      roleTitles: [
        {
          key: 'permissionSets.builtIn.root',
          ns: '@nocobase/app-plugin-authorization',
          defaultValue: 'root',
        },
      ],
    };
    let username = '';
    for (const locale of ['en-US', 'zh-CN']) {
      const response = await app.request('/demoMode/accounts', {
        headers: { 'accept-language': locale },
      });
      expect(response.status).toBe(200);
      const { data } = await response.json();
      const administrator = data.find(
        (account: { role: string }) => account.role === 'root',
      );
      expect(administrator).toMatchObject(expected);
      username = administrator.username;
      expect(response.headers.getSetCookie()).toEqual([]);
    }
    const response = await app.request(
      `/demoMode/accounts/${encodeURIComponent(username)}/signIn`,
      {
        method: 'POST',
        headers: { origin: 'http://localhost', 'accept-language': 'zh-CN' },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { ...expected, current: true },
    });
    expect(response.headers.getSetCookie().length).toBeGreaterThan(0);
  } finally {
    await app.close();
  }
});
