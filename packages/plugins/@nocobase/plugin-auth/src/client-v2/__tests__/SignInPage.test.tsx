/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import SignInPage from '../pages/SignInPage';

const navigateMock = vi.fn();
const mockApp = vi.hoisted(() => ({
  publicPath: '/v/',
  basename: '/v/apps/sub/',
  settingsRouteName: 'admin.settings.',
  settingsRouteRoot: '/admin/settings/',
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    useApp: () => ({
      getPublicPath: () => mockApp.publicPath,
      router: {
        getBasename: () => mockApp.basename,
      },
      pluginSettingsManager: {
        getRouteName: () => mockApp.settingsRouteName,
        getRoutePath: () => mockApp.settingsRouteRoot,
      },
    }),
    usePlugin: () => ({
      authTypes: {
        getEntities: () => [],
      },
      getAuthRedirectFallbackPath: (pathname: string) => (pathname === '/customer/signin' ? '/customer' : '/'),
    }),
  };
});

describe('SignInPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mockApp.publicPath = '/v/';
    mockApp.basename = '/v/apps/sub/';
    mockApp.settingsRouteName = 'admin.settings.';
    mockApp.settingsRouteRoot = '/admin/settings/';
  });

  it('normalizes empty redirect to the current v2 app root for dynamic Portal landing', () => {
    render(
      <MemoryRouter initialEntries={['/signin?redirect=']}>
        <SignInPage />
      </MemoryRouter>,
    );

    expect(navigateMock).toHaveBeenCalledWith(
      {
        pathname: '/signin',
        search: '?redirect=%2Fv%2Fapps%2Fsub',
      },
      { replace: true },
    );
  });

  it('keeps redirect that is already under the current v2 app basename', () => {
    render(
      <MemoryRouter initialEntries={['/signin?redirect=%2Fv%2Fapps%2Fsub%2Fadmin%2F']}>
        <SignInPage />
      </MemoryRouter>,
    );

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('normalizes empty redirect to the current scoped Portal root inside a sub-app', () => {
    mockApp.basename = '/v/apps/sub-app/';

    render(
      <MemoryRouter initialEntries={['/customer/signin?redirect=']}>
        <SignInPage />
      </MemoryRouter>,
    );

    expect(navigateMock).toHaveBeenCalledWith(
      {
        pathname: '/customer/signin',
        search: '?redirect=%2Fv%2Fapps%2Fsub-app%2Fcustomer',
      },
      { replace: true },
    );
  });

  it('normalizes empty redirect to the current standalone Settings root', () => {
    mockApp.publicPath = '/nocobase/';
    mockApp.basename = '/nocobase/settings/apps/sub/';
    mockApp.settingsRouteName = 'settings.';
    mockApp.settingsRouteRoot = '/';

    render(
      <MemoryRouter initialEntries={['/signin?redirect=']}>
        <SignInPage />
      </MemoryRouter>,
    );

    expect(navigateMock).toHaveBeenCalledWith(
      {
        pathname: '/signin',
        search: '?redirect=%2Fnocobase%2Fsettings%2Fapps%2Fsub',
      },
      { replace: true },
    );
  });
});
