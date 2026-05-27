/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const aclStore = {
    data: {},
    meta: {},
    setData: vi.fn((data) => {
      aclStore.data = data;
    }),
    setMeta: vi.fn((meta) => {
      aclStore.meta = meta;
    }),
  };
  const context = {
    acl: aclStore,
    dataSourceManager: {
      getDataSource: vi.fn(() => ({
        getCollection: vi.fn(() => ({})),
      })),
    },
    defineProperty: vi.fn(),
    routeRepository: {
      ensureAccessibleLoaded: vi.fn(),
    },
  };
  const app = {
    apiClient: {
      auth: {
        role: null as string | null,
        setRole: vi.fn(),
      },
      request: vi.fn(),
    },
    dataSourceManager: {
      ensureLoaded: vi.fn(),
    },
    context,
    flowEngine: {
      context,
      flowSettings: {
        disable: vi.fn(),
      },
      translate: vi.fn((text: string) => text),
    },
    pluginSettingsManager: {
      setAclSnippets: vi.fn(),
    },
    renderComponent: vi.fn(() => <div data-testid="app-spin" />),
  };

  return {
    aclStore,
    app,
    createAclSnippetAllow: vi.fn(() => () => true),
    createCollectionContextMeta: vi.fn(() => ({ sort: 0 })),
  };
});

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    ACLContext: ReactModule.createContext(null),
    createAclSnippetAllow: mocks.createAclSnippetAllow,
    useApp: () => mocks.app,
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    createCollectionContextMeta: mocks.createCollectionContextMeta,
  };
});

describe('EmbedAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.app.apiClient.auth.role = null;
    mocks.app.apiClient.request.mockReset();
    mocks.app.dataSourceManager.ensureLoaded.mockResolvedValue(undefined);
    mocks.app.flowEngine.context.routeRepository.ensureAccessibleLoaded.mockResolvedValue(undefined);
    mocks.aclStore.data = {};
    mocks.aclStore.meta = {};
  });

  it('renders 403 instead of redirecting when current user is missing', async () => {
    mocks.app.apiClient.request.mockResolvedValueOnce({
      data: {
        data: {},
      },
    });
    const { EmbedAccessGuard } = await import('../EmbedAccessGuard');

    render(
      <EmbedAccessGuard>
        <div data-testid="embed-content" />
      </EmbedAccessGuard>,
    );

    expect(screen.getByTestId('app-spin')).toBeInTheDocument();
    expect(await screen.findByText('403')).toBeInTheDocument();
    expect(screen.queryByTestId('embed-content')).not.toBeInTheDocument();
    expect(mocks.app.dataSourceManager.ensureLoaded).not.toHaveBeenCalled();
    expect(mocks.app.flowEngine.context.routeRepository.ensureAccessibleLoaded).not.toHaveBeenCalled();
    expect(mocks.app.pluginSettingsManager.setAclSnippets).toHaveBeenCalledWith([]);
    expect(mocks.app.apiClient.auth.setRole).toHaveBeenCalledWith(null);
  });

  it('loads user, data sources and ACL before rendering embed content', async () => {
    mocks.app.apiClient.request
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 1,
            roles: [{ name: 'admin', title: 'Admin' }],
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            role: 'admin',
            snippets: ['ui.*'],
          },
          meta: {
            test: true,
          },
        },
      });
    const { EmbedAccessGuard } = await import('../EmbedAccessGuard');
    const { useCurrentUserContext } = await import('@nocobase/client-v2');
    const CurrentUserProbe = () => {
      const currentUser = useCurrentUserContext();
      return <div data-testid="current-user-id">{currentUser?.data?.data?.id}</div>;
    };

    render(
      <EmbedAccessGuard>
        <div data-testid="embed-content" />
        <CurrentUserProbe />
      </EmbedAccessGuard>,
    );

    expect(await screen.findByTestId('embed-content')).toBeInTheDocument();
    expect(screen.getByTestId('current-user-id')).toHaveTextContent('1');
    expect(mocks.app.apiClient.request).toHaveBeenNthCalledWith(1, {
      url: '/auth:check',
      skipNotify: true,
      skipAuth: true,
    });
    expect(mocks.app.dataSourceManager.ensureLoaded).toHaveBeenCalledTimes(1);
    expect(mocks.app.flowEngine.context.routeRepository.ensureAccessibleLoaded).toHaveBeenCalledTimes(1);
    expect(mocks.app.apiClient.request).toHaveBeenNthCalledWith(2, {
      url: 'roles:check',
      skipNotify: true,
      skipAuth: true,
    });
    expect(mocks.app.flowEngine.context.defineProperty).toHaveBeenCalledWith(
      'user',
      expect.objectContaining({
        value: expect.objectContaining({ id: 1 }),
        resolveOnServer: true,
      }),
    );
    await waitFor(() => {
      expect(mocks.aclStore.setData).toHaveBeenCalledWith({
        role: 'admin',
        snippets: ['ui.*'],
      });
      expect(mocks.aclStore.setMeta).toHaveBeenCalledWith({
        test: true,
      });
      expect(mocks.app.pluginSettingsManager.setAclSnippets).toHaveBeenCalledWith(['ui.*']);
      expect(mocks.app.apiClient.auth.setRole).toHaveBeenCalledWith('admin');
    });
  });
});
