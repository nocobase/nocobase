/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RootLanding, type RootLandingProps } from '../RootLanding';
import { getMultiPortalSettingsUrl } from '../routeUrl';

const rootLandingContext = vi.hoisted(() => ({
  app: undefined as unknown,
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    useApp: () => rootLandingContext.app,
  };
});

function LocationProbe() {
  const location = useLocation();
  return React.createElement('div', null, `${location.pathname}${location.search}${location.hash}`);
}

function renderRootLanding(props: RootLandingProps = {}) {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/?from=root#panel'] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { path: '/', element: React.createElement(RootLanding, props) }),
        React.createElement(Route, { path: '/customer', element: React.createElement(LocationProbe) }),
      ),
    ),
  );
}

describe('Client V2 portal root landing', () => {
  const originalLocation = globalThis.window.location;

  afterEach(() => {
    cleanup();
    rootLandingContext.app = undefined;
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    delete window.__nocobase_modern_client_prefix__;
  });

  it.each([
    ['/v/', '/', '/settings'],
    ['/nocobase/v/', '/nocobase/v/', '/nocobase/settings'],
    ['/v/apps/demo/', '/v/', '/settings/apps/demo'],
    ['/nocobase/v/apps/demo/', '/nocobase/v/', '/nocobase/settings/apps/demo'],
  ])('resolves the Settings fallback for basename %s', (basename, publicPath, expected) => {
    expect(
      getMultiPortalSettingsUrl({
        router: {
          getBasename: () => basename,
        },
        getPublicPath: () => publicPath,
      }),
    ).toBe(expected);
  });

  it('supports a custom modern client prefix', () => {
    window.__nocobase_modern_client_prefix__ = 'modern';
    expect(
      getMultiPortalSettingsUrl({
        router: {
          getBasename: () => '/nocobase/modern/_app/demo/',
        },
        getPublicPath: () => '/nocobase/modern/',
      }),
    ).toBe('/nocobase/settings/_app/demo');
  });

  it('uses the explicit No-code default and preserves query and hash with Router navigation', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          uid: 'customer-portal',
          portalType: 'no-code',
          routePath: '/customer',
        },
      },
    });
    rootLandingContext.app = {
      apiClient: { request },
      layoutManager: { listLayouts: () => [{ uid: 'customer-portal' }] },
      router: { getBasename: () => '/v/' },
      getPublicPath: () => '/v/',
    };

    renderRootLanding();

    expect(await screen.findByText('/customer?from=root#panel')).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith({
      url: 'multiPortals:getDefault',
      method: 'get',
      skipAuth: true,
      skipNotify: true,
    });
  });

  it('uses document navigation for an AI default and preserves query and hash', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });
    rootLandingContext.app = {
      apiClient: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: {
              uid: 'assistant-portal',
              portalType: 'ai',
              routePath: '/assistant',
            },
          },
        }),
      },
      router: { getBasename: () => '/v/' },
      getPublicPath: () => '/v/',
    };

    renderRootLanding();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/x/assistant?from=root#panel');
    });
  });

  it('does not show an intermediate loading indicator before document navigation', () => {
    rootLandingContext.app = {
      apiClient: {
        request: vi.fn().mockReturnValue(new Promise(() => undefined)),
      },
      router: { getBasename: () => '/v/' },
      getPublicPath: () => '/v/',
    };

    const { container } = renderRootLanding();

    expect(container.querySelector('.ant-spin')).not.toBeInTheDocument();
  });

  it('falls back to Settings without resolving an AI default when runtime registration failed', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          uid: 'assistant-portal',
          portalType: 'ai',
          routePath: '/assistant',
        },
      },
    });
    rootLandingContext.app = {
      apiClient: { request },
      router: { getBasename: () => '/v/' },
      getPublicPath: () => '/v/',
    };

    renderRootLanding({ runtimeRegistrationFailed: true });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/settings?from=root#panel');
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('falls back to Settings when the No-code default was not registered', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });
    rootLandingContext.app = {
      apiClient: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: {
              uid: 'customer-portal',
              portalType: 'no-code',
              routePath: '/customer',
            },
          },
        }),
      },
      layoutManager: { listLayouts: () => [] },
      router: { getBasename: () => '/v/' },
      getPublicPath: () => '/v/',
    };

    renderRootLanding();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/settings?from=root#panel');
    });
  });

  it.each(['missing default', 'API error'])('falls back to Settings on %s', async (scenario) => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: { ...originalLocation, replace },
    });
    const request =
      scenario === 'API error'
        ? vi.fn().mockRejectedValue(new Error('failed'))
        : vi.fn().mockResolvedValue({ data: { data: null } });
    rootLandingContext.app = {
      apiClient: { request },
      router: { getBasename: () => '/v/' },
      getPublicPath: () => '/v/',
    };

    renderRootLanding();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/settings?from=root#panel');
    });
  });
});
