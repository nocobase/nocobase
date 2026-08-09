/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { getPortalEntryUrl } from '../url';
import type { AppPortalActionAppLike, AppPortalItem } from '../types';

const app: AppPortalActionAppLike = {
  name: 'main',
  getRouteUrl: (pathname: string) => `/v${pathname}`,
  router: {
    basename: '/v',
  },
};

const portal: AppPortalItem = {
  appName: 'alpha',
  routePath: '/workspace',
};

const currentSubApp: AppPortalActionAppLike = {
  name: 'alpha',
  getRouteUrl: (pathname: string) => `/v${pathname}`,
  router: {
    basename: '/nocobase/v/apps/alpha',
  },
};

const scopedSubApp: AppPortalActionAppLike = {
  name: 'alpha',
  router: {
    basename: '/nocobase/v/apps/alpha',
  },
};

const otherScopedSubApp: AppPortalActionAppLike = {
  name: 'beta',
  router: {
    basename: '/nocobase/v/apps/beta',
  },
};

const aiScopedSubApp: AppPortalActionAppLike = {
  name: 'beta',
  router: {
    basename: '/nocobase/x/apps/beta',
  },
};

afterEach(() => {
  window.__nocobase_modern_client_prefix__ = undefined;
});

describe('getPortalEntryUrl', () => {
  it('builds SSO cross-app URLs through the runtime app route helper when SSO is enabled', () => {
    expect(
      getPortalEntryUrl(app, portal, {
        name: 'alpha',
        ssoEnabled: true,
      }),
    ).toBe('/v/apps/alpha/app-sso?redirect=%2Fworkspace');
  });

  it('builds direct cross-app URLs when SSO is disabled', () => {
    expect(
      getPortalEntryUrl(app, portal, {
        name: 'alpha',
        ssoEnabled: false,
      }),
    ).toBe('/v/apps/alpha/workspace');
  });

  it('builds direct cross-app AI URLs with the x route prefix', () => {
    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          portalType: 'ai',
        },
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ),
    ).toBe('/x/apps/alpha/workspace');
  });

  it('builds direct cross-app AI URLs from another sub-app without keeping its scope', () => {
    expect(
      getPortalEntryUrl(
        otherScopedSubApp,
        {
          ...portal,
          portalType: 'ai',
        },
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ),
    ).toBe('/nocobase/x/apps/alpha/workspace');
  });

  it('builds direct cross-app URLs when SSO state is unknown', () => {
    expect(
      getPortalEntryUrl(app, portal, {
        name: 'alpha',
      }),
    ).toBe('/v/apps/alpha/workspace');
  });

  it('builds SSO URLs for current app portal entries when SSO is enabled', () => {
    expect(
      getPortalEntryUrl(currentSubApp, portal, {
        name: 'alpha',
        ssoEnabled: true,
      }),
    ).toBe('/v/apps/alpha/app-sso?redirect=%2Fworkspace');
  });

  it('keeps current app portal entries direct when SSO is disabled', () => {
    expect(
      getPortalEntryUrl(currentSubApp, portal, {
        name: 'alpha',
        ssoEnabled: false,
      }),
    ).toBe('/nocobase/v/apps/alpha/workspace');
  });

  it('builds current app AI portal entries with the x route prefix', () => {
    expect(
      getPortalEntryUrl(
        currentSubApp,
        {
          ...portal,
          portalType: 'ai',
        },
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ),
    ).toBe('/nocobase/x/apps/alpha/workspace');
  });

  it.each([
    ['no-code', '/v/workspace'],
    ['ai', '/x/workspace'],
  ])('builds main app %s portal entries with the matching route prefix', (portalType, expectedUrl) => {
    expect(
      getPortalEntryUrl(app, {
        ...portal,
        appName: 'main',
        portalType,
      }),
    ).toBe(expectedUrl);
  });

  it.each([
    ['main no-code', 'main', 'no-code', '/v', '/v/v'],
    ['main no-code with an AI-prefix slug', 'main', 'no-code', '/x', '/v/x'],
    ['main AI', 'main', 'ai', '/x', '/x/x'],
    ['main AI with a modern-prefix slug', 'main', 'ai', '/v', '/x/v'],
    ['cross-app no-code', 'alpha', 'no-code', '/v', '/v/apps/alpha/v'],
    ['cross-app no-code with an AI-prefix slug', 'alpha', 'no-code', '/x', '/v/apps/alpha/x'],
    ['cross-app AI', 'alpha', 'ai', '/x', '/x/apps/alpha/x'],
    ['cross-app AI with a modern-prefix slug', 'alpha', 'ai', '/v', '/x/apps/alpha/v'],
  ] as const)('keeps a route-prefix slug for a %s portal entry', (_, appName, portalType, routePath, expectedUrl) => {
    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          appName,
          portalType,
          routePath,
        },
        appName === 'main'
          ? undefined
          : {
              name: appName,
              ssoEnabled: false,
            },
      ),
    ).toBe(expectedUrl);
  });

  it.each([
    ['no-code', '/v', '/nocobase/v/apps/alpha/v'],
    ['no-code', '/x', '/nocobase/v/apps/alpha/x'],
    ['ai', '/x', '/nocobase/x/apps/alpha/x'],
    ['ai', '/v', '/nocobase/x/apps/alpha/v'],
  ] as const)('keeps a route-prefix slug for a current-app %s portal entry', (portalType, routePath, expectedUrl) => {
    expect(
      getPortalEntryUrl(
        currentSubApp,
        {
          ...portal,
          portalType,
          routePath,
        },
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ),
    ).toBe(expectedUrl);
  });

  it.each([
    ['main no-code', 'main', 'no-code', '/v/v'],
    ['main AI', 'main', 'ai', '/x/x'],
    ['cross-app no-code', 'cross-app', 'no-code', '/v/apps/alpha/v'],
    ['cross-app AI', 'cross-app', 'ai', '/x/apps/alpha/x'],
    ['current-app no-code', 'current-app', 'no-code', '/nocobase/v/apps/alpha/v'],
    ['current-app AI', 'current-app', 'ai', '/nocobase/x/apps/alpha/x'],
  ] as const)(
    'keeps a complete prefix-slug path idempotent for a %s portal entry',
    (_, scope, portalType, routePath) => {
      const appName = scope === 'main' ? 'main' : 'alpha';
      const sourceApp = scope === 'current-app' ? currentSubApp : app;

      expect(
        getPortalEntryUrl(
          sourceApp,
          {
            ...portal,
            appName,
            portalType,
            routePath,
          },
          appName === 'main'
            ? undefined
            : {
                name: appName,
                ssoEnabled: false,
              },
        ),
      ).toBe(routePath);
    },
  );

  it.each([
    ['main AI', 'main', 'ai', '/v/workspace', '/x/workspace'],
    [
      'current-app no-code',
      'current-app',
      'no-code',
      '/nocobase/x/apps/alpha/workspace',
      '/nocobase/v/apps/alpha/workspace',
    ],
    ['cross-app AI', 'cross-app', 'ai', '/v/apps/alpha/workspace', '/x/apps/alpha/workspace'],
  ] as const)(
    'converts a complete alternative-base path for a %s portal entry',
    (_, scope, portalType, routePath, expectedUrl) => {
      const appName = scope === 'main' ? 'main' : 'alpha';
      const sourceApp = scope === 'current-app' ? currentSubApp : app;

      expect(
        getPortalEntryUrl(
          sourceApp,
          {
            ...portal,
            appName,
            portalType,
            routePath,
          },
          appName === 'main'
            ? undefined
            : {
                name: appName,
                ssoEnabled: false,
              },
        ),
      ).toBe(expectedUrl);
    },
  );

  it.each([
    ['main', 'main', '/nocobase/admin/admin'],
    ['cross-app', 'alpha', '/nocobase/admin/apps/alpha/admin'],
  ] as const)('keeps a custom modern-prefix slug for a %s portal entry', (_, appName, expectedUrl) => {
    window.__nocobase_modern_client_prefix__ = 'admin';
    const customPrefixApp: AppPortalActionAppLike = {
      name: 'main',
      router: {
        basename: '/nocobase/admin',
      },
    };

    expect(
      getPortalEntryUrl(
        customPrefixApp,
        {
          ...portal,
          appName,
          portalType: 'no-code',
          routePath: '/admin',
        },
        appName === 'main'
          ? undefined
          : {
              name: appName,
              ssoEnabled: false,
            },
      ),
    ).toBe(expectedUrl);
  });

  it('keeps a custom modern-prefix slug for an AI main portal entry', () => {
    window.__nocobase_modern_client_prefix__ = 'admin';
    const customPrefixApp: AppPortalActionAppLike = {
      name: 'main',
      router: {
        basename: '/nocobase/admin',
      },
    };

    expect(
      getPortalEntryUrl(customPrefixApp, {
        ...portal,
        appName: 'main',
        portalType: 'ai',
        routePath: '/admin',
      }),
    ).toBe('/nocobase/x/admin');
  });

  it('converts a complete custom-prefix path for an AI main portal entry', () => {
    window.__nocobase_modern_client_prefix__ = 'admin';
    const customPrefixApp: AppPortalActionAppLike = {
      name: 'main',
      router: {
        basename: '/nocobase/admin',
      },
    };

    expect(
      getPortalEntryUrl(customPrefixApp, {
        ...portal,
        appName: 'main',
        portalType: 'ai',
        routePath: '/nocobase/admin/workspace',
      }),
    ).toBe('/nocobase/x/workspace');
  });

  it.each([
    ['main', 'main', '/nocobase/admin/admin'],
    ['cross-app', 'alpha', '/nocobase/admin/apps/alpha/admin'],
  ] as const)('keeps a complete custom-prefix slug path idempotent for a %s portal entry', (_, appName, routePath) => {
    window.__nocobase_modern_client_prefix__ = 'admin';
    const customPrefixApp: AppPortalActionAppLike = {
      name: 'main',
      router: {
        basename: '/nocobase/admin',
      },
    };

    expect(
      getPortalEntryUrl(
        customPrefixApp,
        {
          ...portal,
          appName,
          portalType: 'no-code',
          routePath,
        },
        appName === 'main'
          ? undefined
          : {
              name: appName,
              ssoEnabled: false,
            },
      ),
    ).toBe(routePath);
  });

  it.each([
    ['/admin', '/nocobase/admin/apps/alpha/admin'],
    ['/nocobase/admin/apps/alpha/admin', '/nocobase/admin/apps/alpha/admin'],
  ])('keeps a custom-prefix slug path for the current app', (routePath, expectedUrl) => {
    window.__nocobase_modern_client_prefix__ = 'admin';
    const customPrefixSubApp: AppPortalActionAppLike = {
      name: 'alpha',
      router: {
        basename: '/nocobase/admin/apps/alpha',
      },
    };

    expect(
      getPortalEntryUrl(
        customPrefixSubApp,
        {
          ...portal,
          portalType: 'no-code',
          routePath,
        },
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ),
    ).toBe(expectedUrl);
  });

  it.each([
    ['no-code', '/nocobase/v/workspace'],
    ['ai', '/nocobase/x/workspace'],
  ])('builds main app %s portal entries from a sub-app without keeping its scope', (portalType, expectedUrl) => {
    expect(
      getPortalEntryUrl(scopedSubApp, {
        ...portal,
        appName: 'main',
        portalType,
      }),
    ).toBe(expectedUrl);
  });

  it.each([
    ['no-code', '/workspace'],
    [undefined, '/workspace'],
    ['no-code', '/nocobase/v/workspace'],
  ])('switches main app %s portal entries from an AI sub-app back to the v route prefix', (portalType, routePath) => {
    expect(
      getPortalEntryUrl(aiScopedSubApp, {
        ...portal,
        appName: 'main',
        portalType,
        routePath,
      }),
    ).toBe('/nocobase/v/workspace');
  });

  it('switches the current app no-code portal from an AI route back to its v scope', () => {
    expect(
      getPortalEntryUrl(
        aiScopedSubApp,
        {
          ...portal,
          appName: 'beta',
          portalType: 'no-code',
        },
        {
          name: 'beta',
          ssoEnabled: false,
        },
      ),
    ).toBe('/nocobase/v/apps/beta/workspace');
  });

  it('switches a cross-app no-code portal from an AI route back to the target v scope', () => {
    expect(
      getPortalEntryUrl(
        aiScopedSubApp,
        {
          ...portal,
          portalType: 'no-code',
        },
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ),
    ).toBe('/nocobase/v/apps/alpha/workspace');
  });

  it('builds cname URLs with portal route path when SSO is disabled', () => {
    expect(
      getPortalEntryUrl(app, portal, {
        name: 'alpha',
        cname: 'alpha.example.com',
        ssoEnabled: false,
      }),
    ).toBe('//alpha.example.com/workspace');
  });

  it.each([
    ['/v', '//alpha.example.com/v/v'],
    ['/x', '//alpha.example.com/v/x'],
  ])('keeps a CNAME no-code prefix slug when SSO is disabled', (routePath, expectedUrl) => {
    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          portalType: 'no-code',
          routePath,
        },
        {
          name: 'alpha',
          cname: 'alpha.example.com',
          ssoEnabled: false,
        },
      ),
    ).toBe(expectedUrl);
  });

  it('keeps a CNAME no-code prefix slug in the SSO redirect', () => {
    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          portalType: 'no-code',
          routePath: '/v',
        },
        {
          name: 'alpha',
          cname: 'alpha.example.com',
          ssoEnabled: true,
        },
      ),
    ).toBe('//alpha.example.com/app-sso?redirect=%2Fv%2Fv');
  });

  it('keeps a CNAME no-code custom-prefix slug when SSO is disabled', () => {
    window.__nocobase_modern_client_prefix__ = 'admin';

    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          portalType: 'no-code',
          routePath: '/admin',
        },
        {
          name: 'alpha',
          cname: 'alpha.example.com',
          ssoEnabled: false,
        },
      ),
    ).toBe('//alpha.example.com/admin/admin');
  });

  it.each([
    ['no-code', false, 'https://external.example/portal'],
    ['ai', false, 'https://external.example/portal'],
    ['ai', true, 'https://external.example/portal'],
    ['ai', false, '//external.example/portal'],
  ])('keeps a CNAME %s portal absolute route unchanged', (portalType, ssoEnabled, routePath) => {
    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          portalType,
          routePath,
        },
        {
          name: 'alpha',
          cname: 'alpha.example.com',
          ssoEnabled,
        },
      ),
    ).toBe(routePath);
  });

  it('builds cname AI URLs with the target app x route prefix when SSO is disabled', () => {
    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          portalType: 'ai',
        },
        {
          name: 'alpha',
          cname: 'alpha.example.com',
          ssoEnabled: false,
        },
      ),
    ).toBe('//alpha.example.com/x/apps/alpha/workspace');
  });

  it('builds cname SSO URLs with portal route redirect when SSO is enabled', () => {
    expect(
      getPortalEntryUrl(app, portal, {
        name: 'alpha',
        cname: 'alpha.example.com',
        ssoEnabled: true,
      }),
    ).toBe('//alpha.example.com/app-sso?redirect=%2Fworkspace');
  });

  it('builds cname SSO URLs with a target app AI portal redirect', () => {
    expect(
      getPortalEntryUrl(
        app,
        {
          ...portal,
          portalType: 'ai',
        },
        {
          name: 'alpha',
          cname: 'alpha.example.com',
          ssoEnabled: true,
        },
      ),
    ).toBe('//alpha.example.com/app-sso?redirect=%2Fx%2Fapps%2Falpha%2Fworkspace');
  });
});
