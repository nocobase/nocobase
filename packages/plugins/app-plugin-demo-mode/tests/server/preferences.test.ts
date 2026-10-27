import {
  userManagementServiceToken,
  userPreferencesServiceToken,
} from '@nocobase/app-plugin-users/server';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Visitor } from '../helpers/preference-visitor.js';

import { createStandaloneServer } from '../helpers/minimal-app.js';

const defaults = {
  locale: 'en-US',
  'theme.mode': 'system',
  'theme.preset': 'compact',
};

describe('demo visitor presentation preferences', () => {
  let app: TestApp;
  beforeAll(async () => {
    app = await createTestApp({
      createServer: createStandaloneServer,
      config: {
        demoMode: { enabled: true, allowCollections: ['userPreferences'] },
        i18n: { defaultLocale: 'en-US' },
      },
    });
  });
  afterAll(() => app.close());

  it('isolates visitors sharing an account and ignores the account’s historical choices', async () => {
    const first = new Visitor(app);
    const second = new Visitor(app);
    const id = await first.signIn();
    expect(await second.signIn()).toBe(id);
    const service = app.application.container.resolve(
      userPreferencesServiceToken,
    );
    await service.setMany(id, {
      locale: 'zh-CN',
      'theme.mode': 'dark',
      'theme.preset': 'old',
    });
    expect(await first.preferences()).toMatchObject(defaults);
    const changed = {
      locale: 'zh-CN',
      'theme.mode': 'dark',
      'theme.preset': 'blue',
    };
    for (const [key, value] of Object.entries(changed)) {
      const response = await first.request(
        `/users/me/preferences/${key}`,
        'PUT',
        { value },
      );
      expect(response.status).toBe(200);
      expect(response.headers.getSetCookie()[0]).toContain(
        `Path=${app.publicBasePath}`,
      );
      expect(response.headers.getSetCookie()[0]).not.toMatch(/Max-Age|Expires/);
    }
    expect(await first.preferences()).toMatchObject(changed);
    expect(await second.preferences()).toMatchObject(defaults);
    expect(await service.list(id)).toMatchObject({
      locale: 'zh-CN',
      'theme.mode': 'dark',
      'theme.preset': 'old',
    });
    const fresh = new Visitor(app);
    await fresh.signIn();
    expect(await fresh.preferences()).toMatchObject(defaults);
  });

  it('keeps choices when switching demo accounts and resets a deleted preference to the site default', async () => {
    const visitor = new Visitor(app);
    await visitor.signIn();
    const changed = {
      locale: 'zh-CN',
      'theme.mode': 'dark',
      'theme.preset': 'blue',
    };
    expect(
      (await visitor.request('/users/me/preferences', 'PATCH', changed)).status,
    ).toBe(200);
    const other = await app.application.container
      .resolve(userManagementServiceToken)
      .create({
        username: 'preference_visitor',
        name: 'Preference visitor',
        email: 'preferences@example.com',
        password: 'Visitor123!',
      });
    expect(
      (
        await visitor.request(
          `/demoMode/accounts/${other.username}/signIn`,
          'POST',
        )
      ).status,
    ).toBe(200);
    expect(await visitor.preferences()).toMatchObject(changed);
    expect(
      (await visitor.request('/users/me/preferences/locale', 'DELETE')).status,
    ).toBe(204);
    expect(await visitor.preferences()).toMatchObject({
      ...changed,
      locale: defaults.locale,
    });
    expect(
      await app.application.container
        .resolve(userPreferencesServiceToken)
        .list(other.id),
    ).toEqual({});
  });

  it('keeps unrelated preferences account-persistent and rejects invalid batches without issuing cookies', async () => {
    const visitor = new Visitor(app);
    const id = await visitor.signIn();
    const response = await visitor.request('/users/me/preferences', 'PATCH', {
      locale: 'zh-CN',
      'inbox.sound': false,
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({
      locale: 'zh-CN',
      'inbox.sound': false,
    });
    expect(
      await app.application.container
        .resolve(userPreferencesServiceToken)
        .get(id, 'inbox.sound'),
    ).toBe(false);
    const invalid = await visitor.request('/users/me/preferences', 'PATCH', {
      locale: 'en-US',
      'INVALID KEY': true,
    });
    expect(invalid.status).toBe(400);
    expect(invalid.headers.getSetCookie()).toEqual([]);
    expect((await visitor.preferences()).locale).toBe('zh-CN');
    const invalidChoice = await visitor.request(
      '/users/me/preferences',
      'PATCH',
      {
        locale: false,
        'inbox.sound': true,
      },
    );
    expect(invalidChoice.status).toBe(400);
    expect((await invalidChoice.json()).error.reason).toBe(
      'INVALID_PREFERENCE_VALUE',
    );
    expect(invalidChoice.headers.getSetCookie()).toEqual([]);
    expect(
      await app.application.container
        .resolve(userPreferencesServiceToken)
        .get(id, 'inbox.sound'),
    ).toBe(false);
    expect(
      (
        await visitor.request('/users/me/preferences/inbox.sound', 'PUT', {
          value: true,
        })
      ).status,
    ).toBe(200);
    expect(
      await app.application.container
        .resolve(userPreferencesServiceToken)
        .get(id, 'inbox.sound'),
    ).toBe(true);
  });

  it('retains authentication, CSRF and input validation', async () => {
    const visitor = new Visitor(app);
    expect((await visitor.request('/users/me/preferences')).status).toBe(401);
    expect(
      (
        await visitor.request('/users/me/preferences/locale', 'PUT', {
          value: 'zh-CN',
        })
      ).status,
    ).toBe(401);
    await visitor.signIn();
    const crossSite = await visitor.request(
      '/users/me/preferences/locale',
      'PUT',
      { value: 'zh-CN' },
      'https://untrusted.example',
    );
    expect(crossSite.status).toBe(403);
    expect(crossSite.headers.getSetCookie()).toEqual([]);
    for (const value of [null, {}, '', 'x'.repeat(101), '<script>']) {
      expect(
        (
          await visitor.request('/users/me/preferences/locale', 'PUT', {
            value,
          })
        ).status,
      ).toBe(400);
    }
  });
});

it('leaves ordinary deployments account-persistent', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: false } },
  });
  try {
    const visitor = new Visitor(app);
    const response = await visitor.request('/auth/sign-in/email', 'POST', {
      email: 'admin@nocobase.com',
      password: 'admin123',
    });
    expect(response.status).toBe(200);
    const id = (await (await visitor.request('/auth/get-session')).json()).user
      .id;
    const result = await visitor.request(
      '/users/me/preferences/locale',
      'PUT',
      { value: 'zh-CN' },
    );
    expect(result.status).toBe(200);
    expect(result.headers.getSetCookie()).toEqual([]);
    expect(
      await app.application.container
        .resolve(userPreferencesServiceToken)
        .get(id, 'locale'),
    ).toBe('zh-CN');
  } finally {
    await app.close();
  }
});

it.each(['en-US', 'zh-CN'])(
  'uses site defaults and session cookies without allowing database preference writes (%s)',
  async (locale) => {
    const app = await createTestApp({
      createServer: createStandaloneServer,
      config: {
        app: { publicOrigin: 'https://demo.example.com' },
        auth: { baseURL: 'https://demo.example.com/main/api/auth' },
        demoMode: { enabled: true },
        i18n: { defaultLocale: locale },
        client: {
          app: { defaultColorScheme: 'light', defaultTheme: 'comfortable' },
        },
        api: { bodyLimit: '1kb' },
      },
    });
    try {
      const origin = 'https://demo.example.com';
      const signIn = await app.request(
        `${origin}${app.publicBasePath}/api/demoMode/accounts/signInDefault`,
        { method: 'POST', headers: { origin } },
      );
      expect(signIn.status).toBe(200);
      const cookie = signIn.headers
        .getSetCookie()
        .filter((header) => !header.includes('Max-Age=0'))
        .map((header) => header.split(';')[0])
        .join('; ');
      const call = (path: string, method = 'GET', body?: unknown) =>
        app.request(`${origin}${app.publicBasePath}/api${path}`, {
          method,
          headers: { origin, cookie, 'content-type': 'application/json' },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
      const response = await call('/users/me/preferences');
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect((await response.json()).data).toEqual({
        locale,
        'theme.mode': 'light',
        'theme.preset': 'comfortable',
      });
      expect(response.headers.getSetCookie()).toEqual([]);
      const write = await call('/users/me/preferences/theme.mode', 'PUT', {
        value: 'dark',
      });
      expect(write.status).toBe(200);
      const issued = write.headers.getSetCookie()[0];
      expect(issued).toContain('HttpOnly');
      expect(issued).toContain('SameSite=None');
      expect(issued).toContain('; Secure');
      expect(issued).toContain('; Partitioned');
      expect(issued).not.toMatch(/Max-Age|Expires/);
      const denied = await call('/users/me/preferences', 'PATCH', {
        locale: 'zh-CN',
        'inbox.sound': true,
      });
      expect(denied.status).toBe(400);
      expect((await denied.json()).error.reason).toBe('DEMO_READ_ONLY');
      expect(denied.headers.getSetCookie()).toEqual([]);
      const oversize = await call('/users/me/preferences', 'PATCH', {
        locale: 'x'.repeat(2048),
      });
      expect(oversize.status).toBe(413);
      expect(oversize.headers.getSetCookie()).toEqual([]);
    } finally {
      await app.close();
    }
  },
);
