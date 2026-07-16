/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getEmbedRoutePath, isEmbedRoutePathname } from '../route';

describe('embed route helpers', () => {
  it('builds embed routes from router basename before falling back to app route url and public path', () => {
    expect(
      getEmbedRoutePath(
        {
          router: {
            getBasename: () => '/v2/apps/app1/',
          },
          getRouteUrl: (pathname: string) => `/ignored/${pathname}`,
        },
        'embed/page-uid',
      ),
    ).toBe('/v2/apps/app1/embed/page-uid');

    expect(
      getEmbedRoutePath(
        {
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
          getPublicPath: () => '/public',
        },
        '/embed/page-uid',
      ),
    ).toBe('/v2/embed/page-uid');

    expect(
      getEmbedRoutePath(
        {
          getPublicPath: () => '/public/',
        },
        '/embed/page-uid',
      ),
    ).toBe('/public/embed/page-uid');
  });

  it('detects embed route pathnames after removing app basename or public path', () => {
    expect(
      isEmbedRoutePathname(
        {
          router: {
            getBasename: () => '/v2/apps/app1',
          },
        },
        '/v2/apps/app1/embed/page-uid',
      ),
    ).toBe(true);
    expect(
      isEmbedRoutePathname(
        {
          getPublicPath: () => '/public/',
        },
        '/public/embed',
      ),
    ).toBe(true);
    expect(
      isEmbedRoutePathname(
        {
          getPublicPath: () => '/',
        },
        '/embed',
      ),
    ).toBe(true);
    expect(isEmbedRoutePathname(undefined, '/embed/page-uid')).toBe(true);
    expect(isEmbedRoutePathname(undefined, '/admin/embed/page-uid')).toBe(false);
  });
});
