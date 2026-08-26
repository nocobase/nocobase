/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getPublicFormRoutePath } from '../route';

describe('public form route helpers', () => {
  it('uses router basename before public path when building public form routes', () => {
    expect(
      getPublicFormRoutePath(
        {
          router: {
            getBasename: () => '/v2/apps/app1',
          },
          getPublicPath: () => '/v2/',
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
        '/public-forms/form-1',
      ),
    ).toBe('/v2/apps/app1/public-forms/form-1');
  });

  it('falls back to app route URL when router basename is absent', () => {
    expect(
      getPublicFormRoutePath(
        {
          getPublicPath: () => '/v2/',
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
        '/public-forms/form-1',
      ),
    ).toBe('/v2/public-forms/form-1');
  });
});
