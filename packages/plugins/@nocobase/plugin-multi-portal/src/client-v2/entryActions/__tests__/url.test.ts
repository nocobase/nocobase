/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getPortalEntryUrl } from '../url';
import type { AppPortalActionAppLike, AppPortalItem } from '../types';

const app: AppPortalActionAppLike = {
  name: 'main',
  getRouteUrl: (pathname: string) => `/v${pathname}`,
};

const portal: AppPortalItem = {
  appName: 'alpha',
  routePath: '/workspace',
};

const currentSubApp: AppPortalActionAppLike = {
  name: 'alpha',
  getRouteUrl: (pathname: string) => `/v${pathname}`,
};

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
    ).toBe('/v/workspace');
  });

  it('builds current app AI portal entries with the x route prefix', () => {
    expect(
      getPortalEntryUrl(
        currentSubApp,
        {
          ...portal,
          developmentMode: 'ai',
        },
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ),
    ).toBe('/x/workspace');
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

  it('builds cname SSO URLs with portal route redirect when SSO is enabled', () => {
    expect(
      getPortalEntryUrl(app, portal, {
        name: 'alpha',
        cname: 'alpha.example.com',
        ssoEnabled: true,
      }),
    ).toBe('//alpha.example.com/app-sso?redirect=%2Fworkspace');
  });
});
