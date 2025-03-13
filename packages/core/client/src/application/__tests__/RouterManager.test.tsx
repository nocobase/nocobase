/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, userEvent, sleep, waitFor } from '@nocobase/test/client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import React, { FC } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { beforeAll } from 'vitest';
import { Application } from '../Application';
import { RouteType, RouterManager, createRouterManager } from '../RouterManager';

describe('Router', () => {
  let app: Application;
  beforeAll(() => {
    const mock = new MockAdapter(axios);
    mock.onGet('pm:listEnabled').reply(200, {
      data: [],
    });
    app = new Application();
  });

  describe('add routes', () => {
    let router: RouterManager;

    beforeEach(() => {
      router = new RouterManager({ type: 'memory', initialEntries: ['/'], basename: '/nocobase/apps/test1' }, app);
    });

    it('basic', () => {
      const route1: RouteType = {
        path: '/',
        element: <div />,
      };
      router.add('test', route1);
      expect(router.getRoutesTree()).toHaveLength(1);
      expect(router.getRoutesTree()).toEqual([route1]);

      const route2: RouteType = {
        path: '/test2',
        element: <div />,
      };

      router.add('test2', route2);

      expect(router.getRoutesTree()).toHaveLength(2);
      expect(router.getRoutesTree()).toMatchObject([route1, route2]);
      expect(router.getRoutes()).toEqual({
        test: route1,
        test2: route2,
      });
      expect(router.get('test')).toEqual(route1);
      expect(router.get('test2')).toEqual(route2);
      expect(router.has('test')).toBeTruthy();
    });

    it('createRouterManager', () => {
      const router = createRouterManager({ type: 'memory', initialEntries: ['/'] }, app);
      const route: RouteType = {
        path: '/',
        element: <div />,
      };
      router.add('test', route);
      expect(router.has('test')).toBeTruthy();
    });

    it('nested route', () => {
      const route1: RouteType = {
        path: '/',
        element: <div />,
      };
      const route2: RouteType = {
        path: '/test2',
        element: <div />,
      };

      router.add('test', route1);
      router.add('test.test2', route2);
      expect(router.getRoutesTree()).toEqual([{ ...route1, children: [route2] }]);
    });

    it('nested route with empty parent', () => {
      const route1: RouteType = {
        path: '/',
        element: <div />,
      };
      const route2: RouteType = {
        path: '/test2',
        element: <div />,
      };
      const route3: RouteType = {
        path: '/test3',
        element: <div />,
      };

      router.add('test', route1);
      router.add('test.empty.test2', route2);
      router.add('test.empty2.empty3.test3', route3);
      expect(router.getRoutesTree()).toEqual([{ ...route1, children: [route2, route3] }]);
    });

    it('Component', () => {
      const Hello = () => <div></div>;
      const route: RouteType = {
        path: '/',
        Component: Hello,
      };
      router.add('test', route);
      expect(router.getRoutesTree()).toEqual([{ path: '/', element: <Hello />, children: undefined }]);
    });

    it('Component is string', () => {
      const router = new RouterManager(
        {
          type: 'memory',
          initialEntries: ['/'],
        },
        app,
      );
      const Hello = () => <div></div>;
      app.addComponents({ Hello });
      const route: RouteType = {
        path: '/',
        Component: 'Hello',
      };
      router.add('test', route);
      expect(router.getRoutesTree()).toEqual([{ path: '/', element: <Hello />, children: undefined }]);
    });

    it('add skipAuthCheck route', () => {
      router.add('skip-auth-check', { path: '/skip-auth-check', Component: 'Hello', skipAuthCheck: true });
      router.add('not-skip-auth-check', { path: '/not-skip-auth-check', Component: 'Hello' });

      const RouterComponent = router.getRouterComponent();
      const BaseLayout: FC = (props) => {
        return <div>BaseLayout {props.children}</div>;
      };
      render(<RouterComponent BaseLayout={BaseLayout} />);
      router.navigate('/skip-auth-check');
      const state = router.state;
      const { pathname, search } = state.location;
      const isSkipedAuthCheck = router.isSkippedAuthCheckRoute(pathname);
      expect(isSkipedAuthCheck).toBe(true);
    });

    it('add not skipAuthCheck route', () => {
      router.add('skip-auth-check', { path: '/skip-auth-check', Component: 'Hello', skipAuthCheck: true });
      router.add('not-skip-auth-check', { path: '/not-skip-auth-check', Component: 'Hello' });

      const RouterComponent = router.getRouterComponent();
      const BaseLayout: FC = (props) => {
        return <div>BaseLayout {props.children}</div>;
      };
      render(<RouterComponent BaseLayout={BaseLayout} />);
      router.navigate('/not-skip-auth-check');
      const state = router.state;
      const { pathname, search } = state.location;
      const isSkipedAuthCheck = router.isSkippedAuthCheckRoute(pathname);
      expect(isSkipedAuthCheck).toBe(false);
    });
  });

  describe('remove', () => {
    let router: RouterManager;

    beforeEach(() => {
      router = new RouterManager({ type: 'memory', initialEntries: ['/'] }, app);
    });
    it('basic', () => {
      const route1: RouteType = {
        path: '/',
        element: <div />,
      };
      router.add('test', route1);
      expect(router.getRoutesTree()).toEqual([route1]);
      router.remove('test');
      expect(router.getRoutesTree()).toEqual([]);
    });
  });

  describe('getRouterComponent', () => {
    it('basic', async () => {
      const router = new RouterManager({ type: 'memory', initialEntries: ['/'] }, app);
      const Layout = () => {
        return (
          <div>
            <div>
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
            </div>
            <Outlet />
          </div>
        );
      };
      router.add('root', {
        element: <Layout />,
      });
      router.add('root.home', {
        path: '/',
        element: <div>HomeComponent</div>,
      });
      router.add('root.about', {
        path: '/about',
        element: <div>AboutComponent</div>,
      });
      const RouterComponent = router.getRouterComponent();
      render(<RouterComponent />);
      expect(screen.getByText('HomeComponent')).toBeInTheDocument();

      await userEvent.click(screen.getByText('About'));
      expect(screen.getByText('AboutComponent')).toBeInTheDocument();
    });

    it('basename and type', async () => {
      const router = new RouterManager({ type: 'browser' }, app);
      router.setType('hash');
      router.setBasename('/admin');
      router.add('home', {
        path: '/',
        element: <div data-testid="content">123</div>,
      });

      const RouterComponent = router.getRouterComponent();
      render(<RouterComponent />);
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(router.getBasename()).toBe('/admin');

      window.location.hash = '#/admin';

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('BaseLayout', () => {
      const router = new RouterManager({ type: 'memory', initialEntries: ['/'] }, app);
      router.add('home', {
        path: '/',
        element: <div>HomeComponent</div>,
      });
      const RouterComponent = router.getRouterComponent();
      const BaseLayout: FC = (props) => {
        return <div>BaseLayout {props.children}</div>;
      };
      render(<RouterComponent BaseLayout={BaseLayout} />);
      expect(screen.getByText('HomeComponent')).toBeInTheDocument();
      expect(screen.getByText('BaseLayout')).toBeInTheDocument();
    });

    it('nested router', () => {
      const router = new RouterManager({ type: 'memory', initialEntries: ['/'] }, app);

      const Test = () => {
        const router2 = new RouterManager({ type: 'memory', initialEntries: ['/'] }, app);
        router2.add('rooter2', {
          path: '/',
          element: <div>Router2</div>,
        });
        const RouterComponent = router2.getRouterComponent();
        return (
          <div>
            Router1
            <RouterComponent />
          </div>
        );
      };

      router.add('home', {
        path: '/',
        element: <Test />,
      });

      const RouterComponent = router.getRouterComponent();
      render(<RouterComponent />);

      expect(screen.getByText('Router1')).toBeInTheDocument();
      expect(screen.getByText('Router2')).toBeInTheDocument();
    });
  });
});
