/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, sleep, userEvent, waitFor } from '@nocobase/test/client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import React, { Component } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { describe } from 'vitest';
import { CollectionFieldInterface } from '../../data-source';
import { OpenModeProvider } from '../../modules/popup/OpenModeProvider';
import { Application } from '../Application';
import { Plugin } from '../Plugin';
import { useApp } from '../hooks';

describe('Application', () => {
  beforeAll(() => {
    const mock = new MockAdapter(axios);
    mock.onGet('pm:listEnabled').reply(200, {
      data: [],
    });
  });

  const router: any = { type: 'memory', initialEntries: ['/'] };
  const initialProvidersLength = 7;
  it('basic', () => {
    const options = { router };
    const app = new Application(options);
    expect(app.getOptions()).toEqual(options);
    expect(app.i18n).toBeDefined();
    expect(app.apiClient).toBeDefined();
    expect(app.components).toBeDefined();
    expect(app.pm).toBeDefined();
    expect(app.providers).toBeDefined();
    expect(app.router).toBeDefined();
    expect(app.scopes).toBeDefined();
    expect(app.providers.length).toBeGreaterThan(1);
    expect(Object.keys(app.components).length).toBeGreaterThan(1);
  });

  describe('getApiUrl', () => {
    it('api path', () => {
      const app = new Application({
        apiClient: {
          baseURL: '/api/',
        },
      });
      const { protocol, host } = window.location;
      const baseURL = `${protocol}//${host}/api/`;
      expect(app.getApiUrl()).toBe(baseURL);
    });

    it('api url', () => {
      const app = new Application({
        apiClient: {
          baseURL: 'http://localhost:13000/foo/api/',
        },
      });
      expect(app.getApiUrl()).toBe('http://localhost:13000/foo/api/');
    });

    it('api url', () => {
      const app = new Application({
        apiClient: {
          baseURL: 'https://123.1.2.3:13000/foo/api/',
        },
      });
      expect(app.getApiUrl()).toBe('https://123.1.2.3:13000/foo/api/');
    });

    it('api url', () => {
      const app = new Application({
        apiClient: {
          baseURL: 'https://123.1.2.3:13000/foo/api',
        },
      });
      expect(app.getApiUrl('/test/bar')).toBe('https://123.1.2.3:13000/foo/api/test/bar');
      expect(app.getApiUrl('test/bar')).toBe('https://123.1.2.3:13000/foo/api/test/bar');
    });
  });

  describe('getHref', () => {
    it('default', () => {
      const app = new Application({});
      expect(app.getHref('test')).toBe('/test');
      expect(app.getHref('/test')).toBe('/test');
    });

    it('custom', () => {
      const app = new Application({ publicPath: '/nocobase' });
      expect(app.getHref('/test')).toBe('/nocobase/test');
      expect(app.getHref('test')).toBe('/nocobase/test');
    });

    it('sub app', () => {
      const app = new Application({ name: 'sub1' });
      expect(app.getHref('test')).toBe('/apps/sub1/test');
      expect(app.getHref('/test')).toBe('/apps/sub1/test');
    });

    it('sub app', () => {
      const app = new Application({ name: 'sub1', publicPath: '/nocobase/' });
      expect(app.getHref('test')).toBe('/nocobase/apps/sub1/test');
      expect(app.getHref('/test')).toBe('/nocobase/apps/sub1/test');
    });
  });

  describe('publicPath', () => {
    it('default', () => {
      const app = new Application({});
      expect(app.getPublicPath()).toBe('/');
      expect(app.getRouteUrl('/test')).toBe('/test');
    });

    it('custom', () => {
      const app = new Application({ publicPath: '/admin' });
      expect(app.getPublicPath()).toBe('/admin/');
      expect(app.getRouteUrl('/test')).toBe('/admin/test');
      expect(app.getRouteUrl('test')).toBe('/admin/test');
    });

    it('custom end with /', () => {
      const app = new Application({ publicPath: '/admin/' });
      expect(app.getPublicPath()).toBe('/admin/');
      expect(app.getRouteUrl('/test/foo')).toBe('/admin/test/foo');
      expect(app.getRouteUrl('test/foo/')).toBe('/admin/test/foo/');
    });
  });

  describe('components', () => {
    const Hello = () => <div>Hello</div>;
    Hello.displayName = 'Hello';

    it('initial', () => {
      const app = new Application({ router, components: { Hello } });
      expect(app.components.Hello).toBe(Hello);
    });

    it('addComponents', () => {
      const app = new Application({ router });
      app.addComponents({ Hello });
      expect(app.components.Hello).toBe(Hello);
    });

    describe('getComponent', () => {
      let originalConsoleError: any;
      beforeEach(() => {
        originalConsoleError = console.error;
      });
      afterEach(() => {
        console.error = originalConsoleError;
      });

      it('arg is Class component', () => {
        class Foo extends Component {
          render() {
            return <div></div>;
          }
        }
        const app = new Application({ router });
        expect(app.getComponent(Foo)).toBe(Foo);
      });

      it('arg is Function component', () => {
        const Foo = () => <div></div>;
        const app = new Application({ router });
        expect(app.getComponent(Foo)).toBe(Foo);
      });

      it('arg is string', () => {
        const Foo = () => <div></div>;
        const app = new Application({ router, components: { Foo } });
        expect(app.getComponent('Foo')).toBe(Foo);
      });

      it('arg is string, but not found in components', () => {
        const app = new Application({ router });
        const fn = vitest.fn();
        console.error = fn;
        expect(app.getComponent('Foo')).toBeUndefined();
        expect(fn).toBeCalled();
      });

      it('arg is null or undefined', () => {
        const app = new Application({ router });
        const fn = vitest.fn();
        console.error = fn;
        expect(app.getComponent(null)).toBeUndefined();
        expect(fn).toBeCalled();
      });

      it('arg is other types', () => {
        const app = new Application({ router });
        const fn = vitest.fn();
        console.error = fn;
        expect(app.getComponent({} as any)).toBeUndefined();
        expect(fn).toBeCalled();
      });
    });

    it('renderComponent', () => {
      const Foo = (props) => <div>{props.name}</div>;
      const app = new Application({ router, components: { Foo } });
      expect(app.renderComponent('Foo', { name: 'bar' })).toEqual(<Foo name="bar" />);
    });
  });

  describe('scopes', () => {
    it('initial', () => {
      const scopes = { foo: 'bar' };
      const app = new Application({ router, scopes });
      expect(app.scopes).toEqual(scopes);
    });

    it('addScopes', () => {
      const app = new Application({ router });
      app.addScopes({ foo: 'bar' });
      expect(app.scopes).toEqual({ foo: 'bar' });
    });
  });

  describe('providers', () => {
    const Hello = (props) => <div>Hello {props.children}</div>;
    const World = (props) => (
      <div>
        <div>World</div>
        <div>{props.name}</div>
        <div>{props.children}</div>
      </div>
    );
    const Foo = (props) => <div>Foo {props.children}</div>;

    it('initial', () => {
      const app = new Application({ router, providers: [Hello, [World, { name: 'aaa' }]] });
      expect(app.providers.slice(initialProvidersLength)).toEqual([
        [OpenModeProvider, undefined],
        [Hello, undefined],
        [World, { name: 'aaa' }],
      ]);
    });

    it('addProviders', () => {
      const app = new Application({ router, providers: [Hello] });
      app.addProviders([[World, { name: 'aaa' }], Foo]);
      expect(app.providers.slice(initialProvidersLength)).toEqual([
        [OpenModeProvider, undefined],
        [Hello, undefined],
        [World, { name: 'aaa' }],
        [Foo, undefined],
      ]);
    });

    it('addProvider', () => {
      const app = new Application({ router, providers: [Hello] });
      app.addProvider(World, { name: 'aaa' });
      expect(app.providers.slice(initialProvidersLength)).toEqual([
        [OpenModeProvider, undefined],
        [Hello, undefined],
        [World, { name: 'aaa' }],
      ]);
    });

    it('use', () => {
      const app = new Application({ router, providers: [Hello] });
      app.use(World, { name: 'aaa' });
      expect(app.providers.slice(initialProvidersLength)).toEqual([
        [OpenModeProvider, undefined],
        [Hello, undefined],
        [World, { name: 'aaa' }],
      ]);
    });

    it('getComposeProviders', async () => {
      const app = new Application({ router, providers: [Hello, [World, { name: 'aaa' }]] });
      const Providers = app.getComposeProviders();
      render(<Foo />, {
        wrapper: Providers,
      });

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('World')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('aaa')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('Foo')).toBeInTheDocument();
      });
    });
  });

  describe('render', () => {
    it('getRootComponent', async () => {
      const app = new Application({
        router,
      });
      const Layout = () => (
        <div>
          <div>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </div>
          <Outlet />
        </div>
      );
      const Home = () => {
        return <div>HomeComponent</div>;
      };
      const About = () => {
        return <div>AboutComponent</div>;
      };

      const HelloProvider = ({ children }) => {
        return <div>Hello {children}</div>;
      };

      app.router.add('root', {
        element: <Layout />,
      });
      app.router.add('root.home', {
        path: '/',
        element: <Home />,
      });
      app.router.add('root.about', {
        path: '/about',
        element: <About />,
      });
      app.addProviders([HelloProvider]);

      const Root = app.getRootComponent();
      render(<Root />);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('HomeComponent')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('About'));
      expect(screen.getByText('AboutComponent')).toBeInTheDocument();
    });

    it('Root with children', async () => {
      const app = new Application({ name: 'test' });

      const Demo = () => {
        const app = useApp();
        return <div>{app.name}</div>;
      };

      const Root = app.getRootComponent();
      render(
        <Root>
          <Demo />
        </Root>,
      );

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });
    });

    it('mount', async () => {
      const Hello = () => <div>Hello</div>;
      const app = new Application({
        router,
        providers: [Hello],
      });

      render(<div id="app"></div>);
      const root = app.mount('#app');
      expect(root).toBeDefined();

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    });

    it('mount root error', () => {
      const app = new Application({
        router,
      });
      const originalConsoleWarn = console.warn;

      const fn = vitest.fn();
      console.warn = fn;
      app.mount('#app');
      expect(fn).toBeCalled();

      console.warn = originalConsoleWarn;
    });

    it('plugin load error', async () => {
      const app = new Application({
        router,
      });
      class DemoPlugin extends Plugin {
        async load() {
          throw new Error('error');
        }
      }
      app.pm.add(DemoPlugin, { name: 'demo' });

      const Root = app.getRootComponent();
      render(<Root />);

      await sleep(10);
      expect(screen.getByText('App Error')).toBeInTheDocument();
    });

    it('replace Component', async () => {
      const AppSpin = () => <div>AppSpin</div>;
      const AppMain = () => <div>AppMain</div>;
      const app = new Application({
        router,
        components: { AppSpin, AppMain },
      });
      const Root = app.getRootComponent();
      render(<Root />);
      expect(screen.getByText('AppSpin')).toBeInTheDocument();
      await sleep(10);
      expect(screen.getByText('AppMain')).toBeInTheDocument();
    });

    it('render component error', async () => {
      const app = new Application({
        router,
      });

      const AppError = () => {
        return <div>AppError</div>;
      };
      const Foo = () => {
        throw new Error('error');
        return null;
      };
      app.use(Foo);
      app.addComponents({
        AppError,
      });

      const originalConsoleWarn = console.error;
      const fn = vitest.fn();
      console.error = fn;

      const Root = app.getRootComponent();
      render(<Root />);
      await sleep(10);
      expect(fn).toBeCalled();

      expect(screen.getByText('AppError')).toBeInTheDocument();

      console.error = originalConsoleWarn;
    });
  });

  describe('alias', () => {
    test('addFieldInterfaceComponentOption', () => {
      class TestInterface extends CollectionFieldInterface {
        name = 'test';
        default = {
          type: 'string',
          uiSchema: {
            type: 'string',
            'x-component': 'TestComponent',
          },
        };
      }
      const app = new Application({
        dataSourceManager: {
          fieldInterfaces: [TestInterface],
        },
      });
      app.addFieldInterfaceComponentOption('test', {
        label: 'A',
        value: 'a',
      });

      expect(app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface('test').componentOptions)
        .toMatchInlineSnapshot(`
        [
          {
            "label": "{{t("TestComponent")}}",
            "useProps": [Function],
            "value": "TestComponent",
          },
          {
            "label": "A",
            "value": "a",
          },
        ]
      `);
    });
  });
});
