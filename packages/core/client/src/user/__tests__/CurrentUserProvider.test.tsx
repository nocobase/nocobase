/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, renderAppOptions, screen, userEvent, waitFor } from '@nocobase/test/client';
import { getApp } from '@nocobase/test/web';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CurrentUserProvider, useCurrentUserContext } from '../CurrentUserProvider';

describe('CurrentUserProvider', () => {
  const createDeferred = () => {
    let resolveDeferred = () => {};
    const promise = new Promise<void>((resolve) => {
      resolveDeferred = resolve;
    });
    return { promise, resolve: resolveDeferred };
  };

  const renderCurrentUserApp = async (options: {
    initialEntries: string[];
    apis: Record<string, any>;
    AdminRoute?: React.ComponentType;
    SignInRoute?: React.ComponentType;
    basename?: string;
  }) => {
    const AdminRoute = options.AdminRoute || (() => <div>Admin route</div>);
    const SignInRoute = options.SignInRoute || (() => <div>Sign in route</div>);

    await renderAppOptions({
      noWrapperSchema: true,
      appOptions: {
        providers: [CurrentUserProvider],
        router: {
          type: 'memory',
          basename: options.basename,
          initialEntries: options.initialEntries,
          routes: {
            admin: {
              path: '/admin',
              Component: AdminRoute,
            },
            'admin.page': {
              path: '/admin/:name',
              Component: AdminRoute,
            },
            signin: {
              path: '/signin',
              Component: SignInRoute,
            },
          },
        },
      },
      apis: options.apis,
    });
  };

  it('should not render protected route while redirecting unauthenticated user with empty user', async () => {
    const adminRender = vi.fn();
    const AdminRoute = () => {
      adminRender();
      return <div>Admin route</div>;
    };

    await renderCurrentUserApp({
      initialEntries: ['/admin/'],
      AdminRoute,
      apis: {
        '/auth:check': {
          data: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in route')).toBeInTheDocument();
    });
    expect(adminRender).not.toHaveBeenCalled();
  });

  it('should not render protected route while redirecting unauthenticated user with 401', async () => {
    const adminRender = vi.fn();
    const AdminRoute = () => {
      adminRender();
      return <div>Admin route</div>;
    };

    await renderCurrentUserApp({
      initialEntries: ['/admin/'],
      AdminRoute,
      apis: {
        '/auth:check': () => [401, { errors: [{ code: 'EMPTY_TOKEN', message: 'Unauthenticated' }] }],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in route')).toBeInTheDocument();
    });
    expect(adminRender).not.toHaveBeenCalled();
  });

  it('should not check current user on builtin auth route', async () => {
    const authCheck = vi.fn(() => [200, { data: { id: 1 } }]);

    await renderCurrentUserApp({
      initialEntries: ['/signin?redirect=/admin/'],
      apis: {
        '/auth:check': authCheck,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in route')).toBeInTheDocument();
    });
    expect(authCheck).not.toHaveBeenCalled();
  });

  it('should not check current user on builtin auth route with basename', async () => {
    const authCheck = vi.fn(() => [200, { data: { id: 1 } }]);

    await renderCurrentUserApp({
      basename: '/nocobase/apps/sub1',
      initialEntries: ['/nocobase/apps/sub1/signin?redirect=/admin/'],
      apis: {
        '/auth:check': authCheck,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in route')).toBeInTheDocument();
    });
    expect(authCheck).not.toHaveBeenCalled();
  });

  it('should encode redirect path and remove basename before navigating to signin', async () => {
    const adminRender = vi.fn();
    const AdminRoute = () => {
      adminRender();
      return <div>Admin route</div>;
    };
    const SignInRoute = () => {
      const location = useLocation();
      const redirect = new URLSearchParams(location.search).get('redirect');
      return <div>Redirect path: {redirect}</div>;
    };

    await renderCurrentUserApp({
      basename: '/nocobase/apps/sub1',
      initialEntries: ['/nocobase/apps/sub1/admin/?foo=1&bar=2'],
      AdminRoute,
      SignInRoute,
      apis: {
        '/auth:check': {
          data: null,
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Redirect path: /admin?foo=1&bar=2')).toBeInTheDocument();
    });
    expect(adminRender).not.toHaveBeenCalled();
  });

  it('should not recheck current user when navigating between protected routes', async () => {
    const authCheck = vi.fn(() => [200, { data: { id: 1 } }]);
    const AdminRoute = () => {
      const location = useLocation();
      const navigate = useNavigate();
      return (
        <div>
          <div>Admin path: {location.pathname}</div>
          <button type="button" onClick={() => navigate('/admin/page2')}>
            go page2
          </button>
        </div>
      );
    };

    await renderCurrentUserApp({
      initialEntries: ['/admin/page1'],
      AdminRoute,
      apis: {
        '/auth:check': authCheck,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Admin path: /admin/page1')).toBeInTheDocument();
    });
    expect(authCheck).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'go page2' }));

    await waitFor(() => {
      expect(screen.getByText('Admin path: /admin/page2')).toBeInTheDocument();
    });
    expect(authCheck).toHaveBeenCalledTimes(1);
  });

  it('should keep protected admin route loading until accessible routes are initialized', async () => {
    const authCheck = vi.fn(() => [200, { data: { id: 1 } }]);
    const accessibleRoutes = createDeferred();
    const loadAccessibleRoutes = vi.fn(async () => {
      await accessibleRoutes.promise;
      return [200, { data: [{ id: 1, schemaUid: 'page-1' }] }];
    });

    const AdminRoute = () => <div>Admin route</div>;

    const { App } = getApp({
      providers: [CurrentUserProvider],
      appOptions: {
        router: {
          type: 'memory',
          initialEntries: ['/admin/page-1'],
          routes: {
            admin: {
              path: '/admin/*',
              Component: AdminRoute,
            },
          },
        },
      },
      apis: {
        '/auth:check': authCheck,
        '/desktopRoutes:listAccessible': loadAccessibleRoutes,
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(authCheck).toHaveBeenCalledTimes(1);
      expect(loadAccessibleRoutes).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText('Admin route')).not.toBeInTheDocument();

    accessibleRoutes.resolve();

    await waitFor(() => {
      expect(screen.getByText('Admin route')).toBeInTheDocument();
    });
  });

  it('should expose non-auth errors instead of keeping loading', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const AdminRoute = () => {
        const currentUser = useCurrentUserContext();
        return <div>Current user error: {currentUser.error?.response?.status}</div>;
      };

      await renderCurrentUserApp({
        initialEntries: ['/admin/'],
        AdminRoute,
        apis: {
          '/auth:check': () => [500, { errors: [{ code: 'SERVER_ERROR', message: 'Server error' }] }],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Current user error: 500')).toBeInTheDocument();
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
