/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { NocoBaseBuildInPlugin } from '../nocobase-buildin-plugin';

describe('nocobase buildin plugin auth redirect', () => {
  const originalLocation = globalThis.window.location;

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('should redirect unauthenticated admin access to legacy signin with replace', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/admin/7vu4c2sdk6h',
        search: '',
        hash: '',
        replace,
      },
    });

    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/7vu4c2sdk6h'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: {
        lang: 'en-US',
        resources: { client: {} },
        cron: {},
      },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: {} });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/signin?redirect=%2Fv2%2Fadmin%2F7vu4c2sdk6h');
    });
  });

  it('should redirect unauthenticated v2 root access to legacy signin with default admin redirect', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/nocobase/v2/',
        search: '',
        hash: '',
        replace,
      },
    });

    const app = createMockClient({
      publicPath: '/nocobase/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/nocobase/v2/'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: {
        lang: 'en-US',
        resources: { client: {} },
        cron: {},
      },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/nocobase/signin?redirect=%2Fnocobase%2Fv2%2Fadmin');
    });
  });

  it('should redirect authenticated v2 admin root to legacy default page before layout render', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/admin',
        search: '',
        hash: '',
        replace,
      },
    });

    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: {
        lang: 'en-US',
        resources: { client: {} },
        cron: {},
      },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: { id: 1 } });
    app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, {
      data: [
        {
          id: 1,
          title: 'Legacy page',
          schemaUid: 'legacy-page',
          type: 'page',
        },
      ],
    });

    const Root = app.getRootComponent();
    const { container } = render(<Root />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin/legacy-page');
    });
    expect(container.innerHTML).not.toContain('Legacy page');
  });

  it('should redirect authenticated direct legacy v2 page access to v1 path', async () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: '/v2/admin/legacy-page/tab/tab-1',
        search: '?from=direct',
        hash: '#dialog',
        replace,
      },
    });

    const app = createMockClient({
      publicPath: '/v2/',
      plugins: [NocoBaseBuildInPlugin as any],
      router: { type: 'memory', initialEntries: ['/v2/admin/legacy-page/tab/tab-1'] },
    });
    app.apiMock.onGet('app:getLang').reply(200, {
      data: {
        lang: 'en-US',
        resources: { client: {} },
        cron: {},
      },
    });
    app.apiMock.onGet('/auth:check').reply(200, { data: { id: 1 } });
    app.apiMock.onGet('/desktopRoutes:listAccessible').reply(200, {
      data: [
        {
          id: 1,
          title: 'Legacy page',
          schemaUid: 'legacy-page',
          type: 'page',
        },
      ],
    });

    const Root = app.getRootComponent();
    render(<Root />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin/legacy-page/tabs/tab-1?from=direct#dialog');
    });
  });
});
