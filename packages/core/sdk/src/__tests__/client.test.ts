/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createClient,
  type CreateClientOptions,
  APIClient,
  getAuthCookieName,
  MemoryStorage,
} from '@nocobase/sdk/client';
import MockAdapter from 'axios-mock-adapter';

type RuntimeWindow = Window & {
  __nocobase_api_base_url__?: string;
  __nocobase_public_path__?: string;
};

describe('@nocobase/sdk/client', () => {
  let cookies: Map<string, string>;

  beforeEach(() => {
    cookies = new Map();
    installBrowserEnvironment(cookies);
  });

  afterEach(() => {
    cookies.clear();
  });

  it('exports a concrete options type and creates the existing APIClient', () => {
    const options: CreateClientOptions = {};
    const client = createClient(options);

    expect(client).toBeInstanceOf(APIClient);
    expect(client.axios.defaults.baseURL).toBe('/api/');
    expect(client.axios.defaults.withCredentials).toBe(true);
    expect(client.appName).toBe('main');
    expect(client.storage).toBeInstanceOf(MemoryStorage);
  });

  it('uses the standard runtime API base URL and infers a sub-application name from the deployment root', () => {
    const runtimeWindow = window as RuntimeWindow;
    runtimeWindow.__nocobase_api_base_url__ = '/console/api/';
    runtimeWindow.__nocobase_public_path__ = '/console/';
    runtimeWindow.location.pathname = '/console/apps/inventory/orders';

    const client = createClient();

    expect(client.axios.defaults.baseURL).toBe('/console/api/');
    expect(client.appName).toBe('inventory');
  });

  it('honors explicit base URL, application name, credentials and storage configuration', () => {
    const client = createClient({
      appName: 'reports',
      baseURL: '/custom-api/',
      storageType: 'memory',
      withCredentials: false,
    });

    expect(client.axios.defaults.baseURL).toBe('/custom-api/');
    expect(client.axios.defaults.withCredentials).toBe(false);
    expect(client.appName).toBe('reports');
    expect(client.storage).toBeInstanceOf(MemoryStorage);
  });

  it('uses the cookie context for GET requests without requiring an Authorization header', async () => {
    const client = createClient();
    const mock = new MockAdapter(client.axios);
    mock.onGet('orders:list').reply((config) => {
      expect(config.withCredentials).toBe(true);
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { data: [] }];
    });

    await expect(client.request({ url: 'orders:list', method: 'get' })).resolves.toMatchObject({ status: 200 });
  });

  it('adds the standard CSRF cookie to unsafe requests without replacing an explicit header', async () => {
    const csrfCookieName = getAuthCookieName('csrfToken', 'main');
    cookies.set(csrfCookieName, 'cookie-token');
    const client = createClient();
    const mock = new MockAdapter(client.axios);

    mock.onPost('orders:create').replyOnce((config) => {
      expect(config.headers?.['X-CSRF-Token']).toBe('cookie-token');
      return [200, { data: { id: 1 } }];
    });
    mock.onPost('orders:create').replyOnce((config) => {
      expect(config.headers?.['X-CSRF-Token']).toBe('explicit-token');
      return [200, { data: { id: 2 } }];
    });

    await client.request({ url: 'orders:create', method: 'post', data: { title: 'First' } });
    await client.request({
      url: 'orders:create',
      method: 'post',
      data: { title: 'Second' },
      headers: { 'X-CSRF-Token': 'explicit-token' },
    });
  });

  it('keeps role cookies and sign-in state compatible while storing tokens only in memory', async () => {
    const client = createClient();
    const mock = new MockAdapter(client.axios);
    mock.onPost('auth:signIn').reply(200, { data: { token: 'session-token' } });
    mock.onPost('auth:signOut').reply(200, { data: {} });

    client.auth.role = 'member';
    expect(document.cookie).toContain(`${getAuthCookieName('role', 'main')}=member`);

    await client.auth.signIn({ email: 'member@example.com' }, 'basic');
    expect(client.auth.token).toBe('session-token');
    expect(client.storage).toBeInstanceOf(MemoryStorage);

    await client.auth.signOut();
    expect(client.auth.token).toBe('');
    expect(document.cookie).not.toContain(`${getAuthCookieName('role', 'main')}=member`);
  });
});

function installBrowserEnvironment(cookies: Map<string, string>): void {
  const location = { pathname: '/', protocol: 'https:' };
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location },
  });
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: location,
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      get cookie() {
        return Array.from(cookies.entries())
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
      },
      set cookie(value: string) {
        const [cookiePair, ...attributes] = value.split(';').map((item) => item.trim());
        const separator = cookiePair.indexOf('=');
        const name = cookiePair.slice(0, separator);
        const cookieValue = cookiePair.slice(separator + 1);
        if (attributes.some((item) => item.toLowerCase() === 'max-age=0')) {
          cookies.delete(name);
        } else {
          cookies.set(name, cookieValue);
        }
      },
    },
  });
}
