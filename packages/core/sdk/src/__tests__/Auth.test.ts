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
    api.auth.token = 'session-token';
    const setItem = vitest.spyOn(api.storage, 'setItem');
    const mock = new MockAdapter(api.axios);

    mock.onPost('auth:createAccessCode').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer session-token');
      expect(JSON.parse(config.data)).toEqual({
        target:
          'files:download?inline=true&name=%E6%B5%8B%E8%AF%95%20backup.nbdata&tags%5B%5D=a%26b&tags%5B%5D=c%2Fd&empty',
      });
      return [
        200,
        {
          data: {
            code: 'temporary/code?',
            expiresAt: 123456,
          },
        },
      ];
    });

    const result = await api.auth.createTemporaryUrl({
      url: 'files:download?inline=true&name=old',
      params: {
        name: '测试 backup.nbdata',
        tags: ['a&b', 'c/d'],
        empty: null,
      },
    });

    const url = new URL(result.url);
    expect(url.origin).toBe('https://example.com');
    expect(url.pathname).toBe('/nocobase/api/files:download');
    expect(url.searchParams.get('inline')).toBe('true');
    expect(url.searchParams.get('name')).toBe('测试 backup.nbdata');
    expect(url.searchParams.getAll('tags[]')).toEqual(['a&b', 'c/d']);
    expect(url.searchParams.has('empty')).toBe(true);
    expect(url.searchParams.get('accessCode')).toBe('temporary/code?');
    expect(url.searchParams.get('__appName')).toBe('sales app');
    expect(result.expiresAt).toBe(123456);
    expect(api.auth.token).toBe('session-token');
    expect(setItem).not.toHaveBeenCalled();
  });

  test('does not add __appName for the main application', async () => {
    const api = new APIClient({
      baseURL: 'https://example.com/api',
      appName: 'main',
      storageType: 'memory',
    });
    const mock = new MockAdapter(api.axios);

    mock.onPost('auth:createAccessCode').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        target: 'reports:export?format=xlsx&filter%5Bstatus%5D=open',
      });
      return [200, { data: { code: 'code', expiresAt: 654321 } }];
    });

    const result = await api.auth.createTemporaryUrl({
      url: '/reports:export?format=csv',
      params: {
        format: 'xlsx',
        filter: { status: 'open' },
      },
    });

    const url = new URL(result.url);
    expect(url.pathname).toBe('/api/reports:export');
    expect(url.searchParams.get('format')).toBe('xlsx');
    expect(url.searchParams.get('filter[status]')).toBe('open');
    expect(url.searchParams.get('accessCode')).toBe('code');
    expect(url.searchParams.has('__appName')).toBe(false);
  });

  test('keeps the resource action colon in the pathname with a relative baseURL', async () => {
    const api = new APIClient({
      baseURL: '/api',
      storageType: 'memory',
    });
    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:createAccessCode').reply(200, {
      data: { code: 'code', expiresAt: 654321 },
    });

    const result = await api.auth.createTemporaryUrl({
      url: 'backups:download',
      params: { filterByTk: 'backup.nbdata' },
    });

    const url = new URL(result.url);
    expect(url.pathname).toBe('/api/backups:download');
    expect(url.protocol).toBe(window.location.protocol);
  });

  test.each([
    { baseURL: '/api', url: '/api/files:download' },
    { baseURL: 'https://example.com/nocobase/api/', url: '/nocobase/api/files:download' },
  ])('rejects a target containing the configured baseURL pathname', async ({ baseURL, url }) => {
    const api = new APIClient({
      baseURL,
      storageType: 'memory',
    });
    const mock = new MockAdapter(api.axios);

    await expect(api.auth.createTemporaryUrl({ url })).rejects.toThrow(
      'Temporary URL targets must not include the API baseURL pathname',
    );
    expect(mock.history.post).toHaveLength(0);
  });

  test.each(['accessCode', '__appName', 'token'])('rejects the reserved %s target parameter', async (name) => {
    const api = new APIClient({
      baseURL: 'https://example.com/api',
      storageType: 'memory',
    });
    const mock = new MockAdapter(api.axios);

    await expect(
      api.auth.createTemporaryUrl({
        url: 'files:download',
        params: { [name]: 'value' },
      }),
    ).rejects.toThrow(`Temporary URL targets cannot contain the ${name} parameter`);
    expect(mock.history.post).toHaveLength(0);
  });
});
