/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildLegacySigninHref,
  convertV2AdminPathToLegacy,
  getCurrentV2RedirectPath,
  redirectToLegacySignin,
  resolveLegacySigninRedirect,
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

  it('should derive legacy signin href from root public path', () => {
    const app = {
      getPublicPath: () => '/nocobase/v2/',
      router: {
        getBasename: () => '/nocobase/v2',
      },
    } as any;

    expect(buildLegacySigninHref(app, '/nocobase/v2/admin/7vu4c2sdk6h')).toBe(
      '/nocobase/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2F7vu4c2sdk6h',
    );
  });

  it('should convert v2 admin path to legacy root-relative path', () => {
    const app = {
      getPublicPath: () => '/v2/',
      router: {
        getBasename: () => '/v2',
      },
    } as any;

    expect(convertV2AdminPathToLegacy(app, '/v2/admin/page-1')).toBe('/admin/page-1');
    expect(convertV2AdminPathToLegacy(app, '/v2/admin/page-1/tab/tab-1')).toBe('/admin/page-1/tabs/tab-1');
    expect(convertV2AdminPathToLegacy(app, '/v2/admin/page-1/view/detail')).toBe('/admin/page-1/popups/detail');
    expect(convertV2AdminPathToLegacy(app, '/v2/admin/page-1/tab/tab-1/view/detail')).toBe(
      '/admin/page-1/tabs/tab-1/popups/detail',
    );
  });

  it('should preserve basename search and hash when converting current legacy path', () => {
    const app = {
      getPublicPath: () => '/nocobase/v2/',
      router: {
        getBasename: () => '/nocobase/v2',
      },
    } as any;

    expect(
      convertV2AdminPathToLegacy(app, {
        pathname: '/nocobase/v2/admin/page-1/tab/tab-1/view/detail',
        search: '?from=menu',
        hash: '#dialog',
      }),
    ).toBe('/nocobase/admin/page-1/tabs/tab-1/popups/detail?from=menu#dialog');
  });

  it('should normalize duplicated slashes during legacy path conversion', () => {
    const app = {
      getPublicPath: () => '/nocobase/v2/',
      router: {
        getBasename: () => '/nocobase/v2/',
      },
    } as any;

    expect(convertV2AdminPathToLegacy(app, '/nocobase//v2//admin//page-1//tab//tab-1')).toBe(
      '/nocobase/admin/page-1/tabs/tab-1',
    );
  });

  it('should return null for non-admin runtime paths', () => {
    const app = {
      getPublicPath: () => '/v2/',
      router: {
        getBasename: () => '/v2',
      },
    } as any;

    expect(convertV2AdminPathToLegacy(app, '/v2/settings')).toBeNull();
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

    redirectToLegacySignin(app, '/v2/admin/7vu4c2sdk6h');

    expect(replace).toHaveBeenCalledWith('/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h');
  });

  it('should accept same-origin legacy signin urls only', () => {
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

    expect(resolveLegacySigninRedirect('/nocobase/signin?redirect=%2Fnocobase%2Fv2%2Fadmin#hash', app)).toBe(
      'http://localhost:20000/nocobase/signin?redirect=%2Fnocobase%2Fv2%2Fadmin#hash',
    );
    expect(resolveLegacySigninRedirect('/signin?redirect=%2Fv2%2Fadmin', app)).toBe(
      'http://localhost:20000/signin?redirect=%2Fv2%2Fadmin',
    );
    expect(resolveLegacySigninRedirect('/nocobase/v2/signin?redirect=%2Fnocobase%2Fv2%2Fadmin', app)).toBeNull();
    expect(resolveLegacySigninRedirect('https://evil.example.com/signin?redirect=%2Fv2%2Fadmin', app)).toBeNull();
    expect(resolveLegacySigninRedirect('/nocobase/admin', app)).toBeNull();
  });
});
