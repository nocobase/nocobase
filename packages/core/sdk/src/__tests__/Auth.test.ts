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

describe('Auth.createAccessCode', () => {
  test('creates an access code bound to the provided URL pattern', async () => {
    const api = new APIClient({
      baseURL: '/api',
      storageType: 'memory',
    });
    const mock = new MockAdapter(api.axios);

    mock.onPost('auth:createAccessCode').reply((config) => {
      expect(JSON.parse(config.data)).toEqual({
        url: 'reports:export?format=*',
      });
      return [200, { data: { code: 'temporary-code' } }];
    });

    await expect(api.auth.createAccessCode({ url: 'reports:export?format=*' })).resolves.toBe('temporary-code');
  });
});
