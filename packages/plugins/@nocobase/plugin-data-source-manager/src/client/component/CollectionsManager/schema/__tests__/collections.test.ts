/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '@nocobase/sdk';
import MockAdapter from 'axios-mock-adapter';
import { describe, expect, it, vi } from 'vitest';
import { getCollectionSchema } from '../collections';

vi.mock('@formily/react', () => ({ Schema: {} }));
vi.mock('@nocobase/client', () => ({ i18n: { t: vi.fn() }, useAPIClient: vi.fn() }));
vi.mock('antd', () => ({ message: {} }));
vi.mock('react-i18next', () => ({ useTranslation: vi.fn() }));
vi.mock('../../CollectionTitle', () => ({ CollectionTitle: () => null }));

describe('external collection list request', () => {
  it.each([
    {},
    { $or: [{ title: { $includes: 't1' } }, { title: { $includes: 't1' } }] },
    { $or: [{ title: { $includes: 't1' } }, { title: { $includes: 't2' } }] },
    { $and: [{ title: { $includes: 't1' } }, { name: { $includes: 'orders' } }] },
    { $and: [{ $or: [{ title: { $includes: 't1' } }, { name: { $includes: 'orders' } }] }] },
  ])('preserves collection filters through the SDK (case %#)', async (conditions) => {
    const schema = getCollectionSchema('postgres');
    const block = Object.values(schema.properties)[0];
    const request = block['x-decorator-props'].request;
    const filter = { ...request.params.filter, ...conditions };
    const api = new APIClient({ baseURL: 'https://localhost:8000/api', storageType: 'memory' });
    const mock = new MockAdapter(api.axios);
    let requestUrl = '';

    mock.onGet('dataSources/postgres/collections:list').reply((config) => {
      const paramsSerializer =
        typeof config.paramsSerializer === 'function'
          ? { serialize: config.paramsSerializer }
          : config.paramsSerializer;
      requestUrl = api.axios.getUri({ ...config, paramsSerializer });
      return [200, { data: [{ name: 't1' }] }];
    });

    const response = await api.request({ ...request, params: { ...request.params, filter, page: 2 } });

    const url = new URL(requestUrl);
    expect(url.pathname).toBe('/api/dataSources/postgres/collections:list');
    expect(url.searchParams.get('filter')).toBe(JSON.stringify(filter));
    expect(filter.hidden).toEqual({ $isFalsy: true });
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('pageSize')).toBe('50');
    expect(url.searchParams.get('sort')).toBe('sort');
    expect(url.searchParams.getAll('appends[]')).toEqual(['category']);
    expect(response.data).toEqual({ data: [{ name: 't1' }] });
  });
});
