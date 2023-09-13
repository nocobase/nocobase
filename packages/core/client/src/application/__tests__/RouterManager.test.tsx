import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import React, { FC } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { render, screen, userEvent } from 'testUtils';
import { beforeAll } from 'vitest';
import { Application } from '../Application';
import { RouteType, RouterManager } from '../RouterManager';

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
      router = new RouterManager({ type: 'memory', initialEntries: ['/'] });
    });

    it('basic', () => {
      const route1: RouteType = {
        path: '/',
        element: <div />,
      };
      router.add('test', route1);
      expect(router.getRoutes()).toHaveLength(1);
      expect(router.getRoutes()).toEqual([route1]);

      const route2: RouteType = {
        path: '/test2',
        element: <div />,
      };

      router.add('test2', route2);
      expect(router.getRoutes()).toHaveLength(2);
      expect(router.getRoutes()).toEqual([route1, route2]);
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
      expect(router.getRoutes()).toEqual([{ ...route1, children: [route2] }]);
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
      expect(router.getRoutes()).toEqual([{ ...route1, children: [route2, route3] }]);
    });

    it('Component', () => {
      const Hello = () => <div></div>;
      const route: RouteType = {
        path: '/',
        Component: Hello,
      };
      router.add('test', route);
      expect(router.getRoutes()).toEqual([{ path: '/', element: <Hello />, children: undefined }]);
    });

    it('Component is string', () => {
      const router = new RouterManager({
        type: 'memory',
        initialEntries: ['/'],
        renderComponent: app.renderComponent.bind(app),
      });
      const Hello = () => <div></div>;
      app.addComponents({ Hello });
      const route: RouteType = {
        path: '/',
        Component: 'Hello',
      };
      router.add('test', route);
      expect(router.getRoutes()).toEqual([{ path: '/', element: <Hello />, children: undefined }]);
    });
  });

  describe('remove', () => {
    let router: RouterManager;

    beforeEach(() => {
      router = new RouterManager({ type: 'memory', initialEntries: ['/'] });
    });
    it('basic', () => {
      const route1: RouteType = {
        path: '/',
        element: <div />,
      };
      router.add('test', route1);
      expect(router.getRoutes()).toEqual([route1]);
      router.remove('test');
      expect(router.getRoutes()).toEqual([]);
    });
  });

  describe('getRouterComponent', () => {
    it('basic', async () => {
      const router = new RouterManager({ type: 'memory', initialEntries: ['/'] });
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

    it('BaseLayout', () => {
      const router = new RouterManager({ type: 'memory', initialEntries: ['/'] });
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
      const router = new RouterManager({ type: 'memory', initialEntries: ['/'] });

      const Test = () => {
        const router2 = new RouterManager({ type: 'memory', initialEntries: ['/'] });
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
