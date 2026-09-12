/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { filterLocaleResources, parseLocaleResourceNamespaces } from '../localeResources';

describe('locale resource filtering', () => {
  it('accepts comma-separated and repeated namespace query values', () => {
    expect(parseLocaleResourceNamespaces(['lm-collections,plugin-a', ' plugin-a , plugin-b '])).toEqual([
      'lm-collections',
      'plugin-a',
      'plugin-b',
    ]);
  });

  it('preserves the legacy full payload when ns is omitted', () => {
    const payload = {
      resources: {
        client: { Save: 'Save' },
        'lm-collections': { Users: 'Users' },
      },
      antd: { locale: 'en' },
    };

    expect(filterLocaleResources(payload, undefined)).toBe(payload);
  });

  it('filters only the resources map and preserves other locale payloads', () => {
    const payload = {
      resources: {
        client: { Save: 'Save' },
        'lm-collections': { Users: 'Users' },
        'plugin-a': { Title: 'Title' },
      },
      antd: { locale: 'en' },
      cron: { every: 'every' },
    };

    expect(filterLocaleResources(payload, 'lm-collections,plugin-a,missing')).toEqual({
      resources: {
        'lm-collections': { Users: 'Users' },
        'plugin-a': { Title: 'Title' },
      },
      antd: { locale: 'en' },
      cron: { every: 'every' },
    });
  });
});
