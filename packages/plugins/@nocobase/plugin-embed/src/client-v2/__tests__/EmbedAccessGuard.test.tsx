/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, waitFor } from '@nocobase/test/client';
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
      ensureLoaded: vi.fn(),
      getDataSource: vi.fn(() => ({
        getCollection: vi.fn(() => ({})),
      })),
    },
    defineProperty: vi.fn(),
    routeRepository: {
      ensureAccessibleLoaded: vi.fn(),
      getRouteBySchemaUid: vi.fn(() => ({ uid: 'test-page' })),
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
    pageUid: 'test-page',
  };
});

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });

  return {
    promise,
    resolve: resolveDeferred,
    reject: rejectDeferred,
  };
}

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

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({
      name: mocks.pageUid,
    }),
  };
});

describe('EmbedAccessGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.app.apiClient.auth.role = null;
    mocks.app.apiClient.request.mockReset();
    mocks.app.dataSourceManager.ensureLoaded.mockResolvedValue(undefined);
    mocks.app.flowEngine.context.dataSourceManager.ensureLoaded.mockResolvedValue(undefined);
    mocks.app.flowEngine.context.routeRepository.ensureAccessibleLoaded.mockResolvedValue(undefined);
    mocks.app.flowEngine.context.routeRepository.getRouteBySchemaUid.mockReturnValue({ uid: 'test-page' });
    mocks.aclStore.data = {};
    mocks.aclStore.meta = {};
    mocks.pageUid = 'test-page';
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

  it('falls back to flow engine data source runtime for v1 compatible app', async () => {
    const originalEnsureLoaded = mocks.app.dataSourceManager.ensureLoaded;
    (
      mocks.app.dataSourceManager as {
        ensureLoaded?: typeof originalEnsureLoaded;
      }
    ).ensureLoaded = undefined;
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
          meta: {},
        },
      });

    try {
      const { EmbedAccessGuard } = await import('../EmbedAccessGuard');

      render(
        <EmbedAccessGuard>
          <div data-testid="embed-content" />
        </EmbedAccessGuard>,
      );

      expect(await screen.findByTestId('embed-content')).toBeInTheDocument();
      expect(originalEnsureLoaded).not.toHaveBeenCalled();
      expect(mocks.app.flowEngine.context.dataSourceManager.ensureLoaded).toHaveBeenCalledTimes(1);
      expect(mocks.app.flowEngine.context.routeRepository.ensureAccessibleLoaded).toHaveBeenCalledTimes(1);
    } finally {
      mocks.app.dataSourceManager.ensureLoaded = originalEnsureLoaded;
    }
  });

  it('renders 403 when the embed page is not accessible to current user', async () => {
    mocks.app.flowEngine.context.routeRepository.getRouteBySchemaUid.mockReturnValue(undefined);
    mocks.app.apiClient.request.mockResolvedValueOnce({
      data: {
        data: {
          id: 1,
          roles: [{ name: 'member', title: 'Member' }],
        },
      },
    });
    const { EmbedAccessGuard } = await import('../EmbedAccessGuard');

    render(
      <EmbedAccessGuard>
        <div data-testid="embed-content" />
      </EmbedAccessGuard>,
    );

    expect(await screen.findByText('403')).toBeInTheDocument();
    expect(screen.queryByTestId('embed-content')).not.toBeInTheDocument();
    expect(mocks.app.flowEngine.context.routeRepository.ensureAccessibleLoaded).toHaveBeenCalledTimes(1);
    expect(mocks.app.flowEngine.context.routeRepository.getRouteBySchemaUid).toHaveBeenCalledWith('test-page');
    expect(mocks.app.apiClient.request).toHaveBeenCalledTimes(1);
    expect(mocks.aclStore.setData).not.toHaveBeenCalledWith(expect.objectContaining({ role: 'member' }));
  });

  it('ignores stale failures from the previous page guard run', async () => {
    const firstAuthCheck = createDeferred<{
      data: {
        data: {
          id: number;
        };
      };
    }>();
    mocks.pageUid = 'old-page';
    mocks.app.apiClient.request
      .mockReturnValueOnce(firstAuthCheck.promise)
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 2,
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
          meta: {},
        },
      });
    const { EmbedAccessGuard } = await import('../EmbedAccessGuard');

    const view = render(
      <EmbedAccessGuard>
        <div data-testid="embed-content" />
      </EmbedAccessGuard>,
    );

    await waitFor(() => {
      expect(mocks.app.apiClient.request).toHaveBeenCalledTimes(1);
    });

    mocks.pageUid = 'new-page';
    view.rerender(
      <EmbedAccessGuard>
        <div data-testid="embed-content" />
      </EmbedAccessGuard>,
    );

    expect(await screen.findByTestId('embed-content')).toBeInTheDocument();

    await act(async () => {
      firstAuthCheck.reject(new Error('old page request failed'));
      await firstAuthCheck.promise.catch(() => undefined);
    });

    expect(screen.getByTestId('embed-content')).toBeInTheDocument();
    expect(screen.queryByText('403')).not.toBeInTheDocument();
  });
});
