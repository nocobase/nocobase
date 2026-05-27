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
import { useLocation } from 'react-router-dom';
import { Application, Plugin } from '../../application';
import { mockAPIClient } from '../../testUtils';
import { CurrentUserProvider } from '../CurrentUserProvider';

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('CurrentUserProvider', () => {
  it('does not redirect to signin on skipped auth-check routes', async () => {
    const { apiClient, mockRequest } = mockAPIClient();
    mockRequest.onGet('/auth:check').reply(200, {
      data: {},
    });

    class TestPlugin extends Plugin {
      async load() {
        this.router.add('embed', {
          path: '/embed/:name',
          skipAuthCheck: true,
          Component: () => (
            <CurrentUserProvider>
              <LocationProbe />
              <div data-testid="embed-content" />
            </CurrentUserProvider>
          ),
        });
        this.router.add('signin', {
          path: '/signin',
          Component: () => <div data-testid="signin" />,
        });
      }
    }

    const app = new Application({
      apiClient,
      router: {
        type: 'memory',
        initialEntries: ['/embed/page-uid'],
      },
      components: {
        AppSpin: () => <div data-testid="app-spin" />,
      },
      plugins: [TestPlugin],
    });
    const Root = app.getRootComponent();

    render(<Root />);

    expect(await screen.findByTestId('embed-content')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/embed/page-uid');
    expect(screen.queryByTestId('signin')).not.toBeInTheDocument();
  });
});
