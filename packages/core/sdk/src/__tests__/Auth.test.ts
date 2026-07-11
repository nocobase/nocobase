/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MockAdapter from 'axios-mock-adapter';
import { APIClient } from '../APIClient';

describe('Auth.createTemporaryUrl', () => {
  test('creates an absolute URL bound to the encoded target and current sub-application', async () => {
    const api = new APIClient({
      baseURL: 'https://example.com/nocobase/api/',
      appName: 'sales app',
      storageType: 'memory',
    });
    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:createAccessCode').reply(200, { data: { code: 'temporary/code?' } });

    const result = await api.auth.createTemporaryUrl({
      url: 'files:download',
      params: {
        name: '测试 backup.nbdata',
        tags: ['a&b', 'c/d'],
      },
    });

    const url = new URL(result);
    expect(url.pathname).toBe('/nocobase/api/files:download');
    expect(url.searchParams.get('name')).toBe('测试 backup.nbdata');
    expect(url.searchParams.getAll('tags[]')).toEqual(['a&b', 'c/d']);
    expect(url.searchParams.get('accessCode')).toBe('temporary/code?');
    expect(url.searchParams.get('__appName')).toBe('sales app');
  });

  test('creates a resource-action URL from a relative baseURL without adding the main app name', async () => {
    const api = new APIClient({
      baseURL: '/api',
      appName: 'main',
      storageType: 'memory',
    });
    const mock = new MockAdapter(api.axios);

    mock.onPost('auth:createAccessCode').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        target: 'reports:export?format=xlsx&filter%5Bstatus%5D=open',
      });
      return [200, { data: { code: 'code' } }];
    });

    const result = await api.auth.createTemporaryUrl({
      url: '/reports:export?format=csv',
      params: {
        format: 'xlsx',
        filter: { status: 'open' },
      },
    });

    const url = new URL(result, 'http://localhost');
    expect(url.pathname).toBe('/api/reports:export');
    expect(url.searchParams.get('format')).toBe('xlsx');
    expect(url.searchParams.get('filter[status]')).toBe('open');
    expect(url.searchParams.get('accessCode')).toBe('code');
    expect(url.searchParams.has('__appName')).toBe(false);
  });

  test.each([
    ['an absolute URL', { url: 'https://example.com/files:download' }, 'app-local URL'],
    ['a fragment', { url: 'files:download#section' }, 'fragment'],
    ['dot path segments', { url: 'files/../files:download' }, 'dot path segments'],
    ['the API base pathname', { url: '/api/files:download' }, 'API baseURL pathname'],
    ...['accessCode', '__appName', 'token'].map((name) => [
      `the reserved ${name} parameter`,
      { url: 'files:download', params: { [name]: 'value' } },
      `${name} parameter`,
    ]),
  ])('rejects a target containing %s', async (_, options, message) => {
    const api = new APIClient({
      baseURL: '/api',
      storageType: 'memory',
    });

    await expect(api.auth.createTemporaryUrl(options)).rejects.toThrow(message);
  });
});
