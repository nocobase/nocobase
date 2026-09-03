/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@nocobase/test/client';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CurrentUserProvider } from '../CurrentUserProvider';

const mocks = vi.hoisted(() => ({
  useRequest: vi.fn(),
  request: vi.fn(),
  syncCookies: vi.fn(),
  flowEngine: {
    context: {
      dataSourceManager: {
        getDataSource: () => ({
          getCollection: () => null,
        }),
      },
      defineProperty: vi.fn(),
    },
    translate: (text: string) => text,
  },
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/flow-engine')>()),
  createCollectionContextMeta: () => ({}),
  useFlowEngine: () => mocks.flowEngine,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/signin', search: '' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api-client')>()),
  useAPIClient: () => ({
    request: mocks.request,
    auth: {
      syncCookies: mocks.syncCookies,
    },
  }),
  useRequest: mocks.useRequest,
}));

vi.mock('../../application', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../application')>()),
  useApp: () => ({
    flowEngine: mocks.flowEngine,
  }),
  useAppSpin: () => ({
    render: () => <div data-testid="app-spin" />,
  }),
}));

describe('CurrentUserProvider', () => {
  it('bootstraps auth cookies after the initial authenticated user check', async () => {
    mocks.request.mockResolvedValue({
      data: {
        data: {
          id: 1,
        },
      },
    });
    mocks.syncCookies.mockResolvedValue({ data: { synced: true } });
    mocks.useRequest.mockReturnValue({
      data: {
        data: {
          id: 1,
        },
      },
      loading: false,
    });

    render(
      <CurrentUserProvider>
        <div data-testid="content" />
      </CurrentUserProvider>,
    );

    const requestCurrentUser = mocks.useRequest.mock.calls[0][0];
    await requestCurrentUser();

    expect(mocks.request).toHaveBeenCalledWith({
      url: '/auth:check',
      skipNotify: true,
      skipAuth: true,
    });
    expect(mocks.syncCookies).toHaveBeenCalledTimes(1);
  });

  it('keeps children mounted when refreshing after the first auth check has completed', () => {
    mocks.useRequest
      .mockReturnValueOnce({
        data: {
          data: {},
        },
        loading: false,
      })
      .mockReturnValueOnce({
        data: undefined,
        loading: true,
      });

    const { rerender } = render(
      <CurrentUserProvider>
        <div data-testid="content" />
      </CurrentUserProvider>,
    );

    rerender(
      <CurrentUserProvider>
        <div data-testid="content" />
      </CurrentUserProvider>,
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(document.querySelector('.ant-spin')).not.toBeInTheDocument();
  });

  it('keeps children mounted when refreshing with existing user request data', () => {
    mocks.useRequest
      .mockReturnValueOnce({
        data: {
          data: {
            id: 1,
          },
        },
        loading: false,
      })
      .mockReturnValueOnce({
        data: {
          data: {
            id: 1,
          },
        },
        loading: true,
      });

    const { rerender } = render(
      <CurrentUserProvider>
        <div data-testid="content" />
      </CurrentUserProvider>,
    );

    rerender(
      <CurrentUserProvider>
        <div data-testid="content" />
      </CurrentUserProvider>,
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.queryByTestId('app-spin')).not.toBeInTheDocument();
  });

  it('shows the app spin during the first auth check', () => {
    mocks.useRequest.mockReturnValue({
      data: undefined,
      loading: true,
    });

    render(
      <CurrentUserProvider>
        <div data-testid="content" />
      </CurrentUserProvider>,
    );

    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });
});
