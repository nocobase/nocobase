/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@nocobase/test/client';
import React from 'react';
import { Application } from '../../application/Application';
import { mockAPIClient } from '../../testUtils/mockAPIClient';
import { CurrentUserProvider } from '../CurrentUserProvider';

const createCurrentUserTestApp = (initialEntries: string[]) => {
  const { apiClient, mockRequest } = mockAPIClient();
  const app = new Application({
    apiClient,
    router: {
      type: 'memory',
      initialEntries,
      routes: {
        admin: {
          path: '/admin',
          Component: () => <div>Admin page</div>,
        },
        signin: {
          path: '/signin',
          skipAuthCheck: true,
          Component: () => <div>Sign in page</div>,
        },
      },
    },
  });

  apiClient.app = app;

  const AppProviders = app.getComposeProviders();
  const Router = app.router.getRouterComponent();
  const BaseLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    return (
      <AppProviders>
        <CurrentUserProvider>{children}</CurrentUserProvider>
      </AppProviders>
    );
  };

  const Root = () => {
    return (
      <FlowEngineProvider engine={app.flowEngine}>
        <Router BaseLayout={BaseLayout} />
      </FlowEngineProvider>
    );
  };

  return { app, mockRequest, Root };
};

describe('CurrentUserProvider', () => {
  it('should redirect admin route to signin immediately when auth check returns 401', async () => {
    const { app, mockRequest, Root } = createCurrentUserTestApp(['/admin']);

    mockRequest.onGet('/auth:check').reply(401, {
      errors: [{ code: 'EMPTY_TOKEN', message: 'Unauthenticated' }],
    });

    render(<Root />);

    await waitFor(() => {
      expect(screen.getByText('Sign in page')).toBeInTheDocument();
    });

    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
    expect(app.router.state.location.pathname).toBe('/signin');
    expect(app.router.state.location.search).toBe('?redirect=/admin');
  });

  it('should keep signin route renderable when auth check returns 401 on signin route', async () => {
    const { app, mockRequest, Root } = createCurrentUserTestApp(['/signin']);

    mockRequest.onGet('/auth:check').reply(401, {
      errors: [{ code: 'EMPTY_TOKEN', message: 'Unauthenticated' }],
    });

    render(<Root />);

    await waitFor(() => {
      expect(screen.getByText('Sign in page')).toBeInTheDocument();
    });

    expect(app.router.state.location.pathname).toBe('/signin');
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
  });
});
