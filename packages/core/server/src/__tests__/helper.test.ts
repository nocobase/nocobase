/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolveCorsOrigin } from '../helper';

describe('resolveCorsOrigin', () => {
  const origin = 'https://portal.example.com';

  afterEach(() => {
    delete process.env.CORS_ORIGIN_WHITELIST;
  });

  it('allows every origin when the whitelist contains an asterisk', () => {
    process.env.CORS_ORIGIN_WHITELIST = '*';

    expect(resolveCorsOrigin({ get: () => origin })).toBe(origin);
  });

  it('allows an asterisk alongside explicit origins', () => {
    process.env.CORS_ORIGIN_WHITELIST = 'https://admin.example.com, *';

    expect(resolveCorsOrigin({ get: () => origin })).toBe(origin);
  });

  it('keeps exact matching when the whitelist does not contain an asterisk', () => {
    process.env.CORS_ORIGIN_WHITELIST = 'https://admin.example.com';

    expect(resolveCorsOrigin({ get: () => origin })).toBe(false);
  });
});
