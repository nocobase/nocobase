/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { getAuthCookieName } from '@nocobase/utils/client';
import { APIClient } from '../APIClient';
import { Auth } from '../Auth';

describe('api-client', () => {
  let storage: Map<string, string>;
  let cookies: Map<string, string>;

  beforeEach(() => {
    storage = new Map();
    cookies = new Map();

    const localStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        localStorage: localStorageMock,
        location: {
          protocol: 'https:',
        },
      },
    });

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        get cookie() {
          return Array.from(cookies.entries())
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
        },
        set cookie(value: string) {
          const [cookiePair, ...attributes] = value.split(';').map((item) => item.trim());
          const [name, cookieValue] = cookiePair.split('=');
          if (attributes.some((item) => item.toLowerCase() === 'max-age=0')) {
            cookies.delete(name);
          } else {
            cookies.set(name, cookieValue);
          }
        },
      },
    });

    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: {
        protocol: 'https:',
      },
    });
  });

  afterEach(() => {
    if (typeof document !== 'undefined') {
      document.cookie = `${getAuthCookieName('role', 'main')}=; Max-Age=0; Path=/`;
      document.cookie = `${getAuthCookieName('role', 'myApp')}=; Max-Age=0; Path=/`;
    }
    storage.clear();
    cookies.clear();
  });

  test('instance', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
    });
    const mock = new MockAdapter(api.axios);
    mock.onGet('users:get').reply(200, {
      data: { id: 1, name: 'John Smith' },
    });
    const response = await api.request({ url: 'users:get' });
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      data: { id: 1, name: 'John Smith' },
    });
    expect(api.axios.defaults.withCredentials).toBeUndefined();
  });

  test('respects explicit credentials option', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      withCredentials: true,
    });

    expect(api.axios.defaults.withCredentials).toBe(true);
  });

  test('signIn', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      storagePrefix: 'N1_',
    });
    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:signIn').reply(200, {
      data: { id: 1, name: 'John Smith', token: '123' },
    });

    const token1 = localStorage.getItem('N1_TOKEN');
    expect(token1).toBe(null);
    const auth1 = localStorage.getItem('N1_AUTH');
    expect(auth1).toBe(null);

    const response = await api.auth.signIn({}, 'basic');
    expect(response.status).toBe(200);
    expect(api.auth.getToken()).toBe('123');
    const token = localStorage.getItem('N1_TOKEN');
    expect(token).toBe('123');
    const auth = localStorage.getItem('N1_AUTH');
    expect(auth).toBe('basic');
  });

  test('syncCookies', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
    });
    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:syncCookies').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer 123');
      return [200, { data: { synced: true } }];
    });

    expect(await api.auth.syncCookies()).toBeUndefined();

    api.auth.setToken('123');
    const response = await api.auth.syncCookies();

    expect(response?.status).toBe(200);
    expect(response?.data).toMatchObject({ data: { synced: true } });
  });

  test('set token', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      appName: 'myApp',
      storagePrefix: 'N2_',
    });
    api.auth.setToken('123');
    expect(api.auth.getToken()).toBe('123');
    const token = localStorage.getItem('N2_MYAPP_TOKEN');
    expect(token).toBe('123');
  });

  test('set token with base storage prefix', async () => {
    const api1 = new APIClient({
      baseURL: 'https://localhost:8000/api',
      storagePrefix: 'N2_',
      shareToken: true,
    });
    api1.auth.setToken('123');
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      appName: 'myApp',
      storagePrefix: 'N2_',
      shareToken: true,
    });
    expect(api.auth.getToken()).toBe('123');
  });

  test('set role cookie with app namespace', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      appName: 'myApp',
    });

    api.auth.setRole('admin');
    expect(document.cookie).toContain(`${getAuthCookieName('role', 'myApp')}=admin`);

    api.auth.setRole(null);
    expect(document.cookie).not.toContain(`${getAuthCookieName('role', 'myApp')}=admin`);
  });

  test('resource action', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
    });
    const mock = new MockAdapter(api.axios);
    mock.onPost('users:test').reply(200, {
      data: { id: 1, name: 'John Smith', token: '123' },
    });
    const response = await api.resource('users').test();
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      data: { id: 1, name: 'John Smith', token: '123' },
    });
  });

  test('custom auth', async () => {
    class TestAuth extends Auth {
      async signIn(values: any): Promise<AxiosResponse<any, any>> {
        const response = await this.api.request({
          method: 'post',
          url: 'auth:test',
          data: values,
        });
        const data = response?.data?.data;
        this.setAuthenticator('test');
        this.setToken(data?.token);
        return response;
      }
    }

    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      authClass: TestAuth,
    });

    expect(api.auth).toBeInstanceOf(TestAuth);

    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:test').reply(200, {
      data: { id: 1, name: 'John Smith', token: '123' },
    });

    const response = await api.auth.signIn({});
    expect(response.status).toBe(200);
    expect(api.auth.getToken()).toBe('123');
    const token = localStorage.getItem('NOCOBASE_TOKEN');
    expect(token).toBe('123');
    const auth = localStorage.getItem('NOCOBASE_AUTH');
    expect(auth).toBe('test');
  });
});
