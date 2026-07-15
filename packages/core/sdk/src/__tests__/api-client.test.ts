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
import { APIClient } from '../APIClient';
import { Auth } from '../Auth';

describe('api-client', () => {
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
    });
    api1.auth.setToken('123');
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      appName: 'myApp',
      storagePrefix: 'N2_',
    });
    expect(api.auth.getToken()).toBe('123');
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
