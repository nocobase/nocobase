/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildV2SigninHref,
  getCurrentV2RedirectPath,
  redirectToV2Signin,
  resolveV2SigninRedirect,
} from '../authRedirect';

describe('auth redirect helpers', () => {
  const originalLocation = globalThis.window.location;

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('should preserve search and hash when building current v2 redirect path', () => {
    const app = {
      getPublicPath: () => '/v2/',
      router: {
        getBasename: () => '/v2',
      },
    } as any;

    expect(
      getCurrentV2RedirectPath(app, {
        pathname: '/v2/admin/7vu4c2sdk6h',
        search: '?tab=overview',
        hash: '#section-a',
      }),
    ).toBe('/v2/admin/7vu4c2sdk6h?tab=overview#section-a');
  });

  it('should remove basename before restoring root-relative v2 path', () => {
    const app = {
      getPublicPath: () => '/nocobase/v2/',
      router: {
        getBasename: () => '/nocobase/v2',
      },
    } as any;

    expect(
      getCurrentV2RedirectPath(app, {
        pathname: '/nocobase/v2/admin/7vu4c2sdk6h',
        search: '?from=menu',
        hash: '#tab-1',
      }),
    ).toBe('/nocobase/v2/admin/7vu4c2sdk6h?from=menu#tab-1');
  });

  it('should derive v2 signin href from v2 public path', () => {
    const app = {
      getPublicPath: () => '/nocobase/v2/',
      router: {
        getBasename: () => '/nocobase/v2',
      },
    } as any;

    expect(buildV2SigninHref(app, '/nocobase/v2/admin/7vu4c2sdk6h')).toBe(
      '/nocobase/v2/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2F7vu4c2sdk6h',
    );
  });

  it('should derive v2 signin href when root public path is "/"', () => {
    const app = {
      getPublicPath: () => '/v2/',
      router: {
        getBasename: () => '/v2',
      },
    } as any;

    expect(buildV2SigninHref(app, '/v2/admin/7vu4c2sdk6h')).toBe('/v2/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h');
  });

  it('should redirect with window.location.replace by default', () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace,
      },
    });

    const app = {
      getPublicPath: () => '/v2/',
      router: {
        getBasename: () => '/v2',
      },
    } as any;

    redirectToV2Signin(app, '/v2/admin/7vu4c2sdk6h');

    expect(replace).toHaveBeenCalledWith('/v2/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h');
  });

  it('should accept same-origin v2 signin urls only', () => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        origin: 'http://localhost:20000',
      },
    });

    const app = {
      getPublicPath: () => '/nocobase/v2/',
      router: {
        getBasename: () => '/nocobase/v2',
      },
    } as any;

    expect(resolveV2SigninRedirect('/nocobase/v2/signin?redirect=%2Fnocobase%2Fv2%2Fadmin#hash', app)).toBe(
      'http://localhost:20000/nocobase/v2/signin?redirect=%2Fnocobase%2Fv2%2Fadmin#hash',
    );
    expect(resolveV2SigninRedirect('/signin?redirect=%2Fv2%2Fadmin', app)).toBe(
      'http://localhost:20000/signin?redirect=%2Fv2%2Fadmin',
    );
    expect(resolveV2SigninRedirect('/nocobase/signin?redirect=%2Fnocobase%2Fv2%2Fadmin', app)).toBeNull();
    expect(resolveV2SigninRedirect('https://evil.example.com/signin?redirect=%2Fv2%2Fadmin', app)).toBeNull();
    expect(resolveV2SigninRedirect('/nocobase/admin', app)).toBeNull();
  });
});
