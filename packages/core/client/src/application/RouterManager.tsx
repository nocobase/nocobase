/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { get, set } from 'lodash';
import React, { ComponentType, createContext, useContext } from 'react';
import { matchRoutes } from 'react-router';
import {
  BrowserRouterProps,
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
  HashRouterProps,
  MemoryRouterProps,
  Outlet,
  RouteObject,
  RouterProvider,
  useRouteError,
} from 'react-router-dom';
import VariablesProvider from '../variables/VariablesProvider';
import { Application } from './Application';
import { CustomRouterContextProvider } from './CustomRouterContextProvider';
import { BlankComponent, RouterContextCleaner } from './components';

export interface BrowserRouterOptions extends Omit<BrowserRouterProps, 'children'> {
  type?: 'browser';
}
export interface HashRouterOptions extends Omit<HashRouterProps, 'children'> {
  type?: 'hash';
}
export interface MemoryRouterOptions extends Omit<MemoryRouterProps, 'children'> {
  type?: 'memory';
}
export type RouterOptions = (HashRouterOptions | BrowserRouterOptions | MemoryRouterOptions) & {
  renderComponent?: RenderComponentType;
  routes?: Record<string, RouteType>;
};
export type ComponentTypeAndString<T = any> = ComponentType<T> | string;
export interface RouteType extends Omit<RouteObject, 'children' | 'Component'> {
  Component?: ComponentTypeAndString;
  skipAuthCheck?: boolean;
}
export type RenderComponentType = (Component: ComponentTypeAndString, props?: any) => React.ReactNode;

export class RouterManager {
  protected routes: Record<string, RouteType> = {};
  protected options: RouterOptions;
  public app: Application;
  public router;
  get basename() {
    return this.router.basename;
  }
  get state() {
    return this.router.state;
  }
  get navigate() {
    return this.router.navigate;
  }

  constructor(options: RouterOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
    this.routes = options.routes || {};
  }

  /**
   * @internal
   */
  getRoutesTree(): RouteObject[] {
    type RouteTypeWithChildren = RouteType & { children?: RouteTypeWithChildren };
    const routes: Record<string, RouteTypeWithChildren> = {};

    /**
     * { 'a': { name: '1' }, 'a.b': { name: '2' }, 'a.c': { name: '3' } };
     * =>
     * { a: { name: '1', children: { b: { name: '2' }, c: {name: '3'} } } }
     */
    for (const [name, route] of Object.entries(this.routes)) {
      set(routes, name.split('.').join('.children.'), { ...get(routes, name.split('.').join('.children.')), ...route });
    }

    /**
     * get RouteObject tree
     *
     * @example
     * { a: { name: '1', children: { b: { name: '2' }, c: { children: { d: { name: '3' } } } } } }
     * =>
     * { name: '1', children: [{ name: '2' }, { name: '3' }] }
     */
    const buildRoutesTree = (routes: RouteTypeWithChildren): RouteObject[] => {
      return Object.values(routes).reduce<RouteObject[]>((acc, item) => {
        if (Object.keys(item).length === 1 && item.children) {
          acc.push(...buildRoutesTree(item.children));
        } else {
          const { Component, element, children, ...reset } = item;
          let ele = element;
          if (Component) {
            if (typeof Component === 'string') {
              ele = this.app.renderComponent(Component);
            } else {
              ele = React.createElement(Component);
            }
          }
          const res = {
            ...reset,
            element: ele,
            children: children ? buildRoutesTree(children) : undefined,
          } as RouteObject;
          acc.push(res);
        }
        return acc;
      }, []);
    };

    return buildRoutesTree(routes);
  }

  getRoutes() {
    return this.routes;
  }

  setType(type: RouterOptions['type']) {
    this.options.type = type;
  }

  getBasename() {
    return this.options.basename;
  }

  setBasename(basename: string) {
    this.options.basename = basename;
  }

  matchRoutes(pathname: string) {
    const routes = Object.values(this.routes);
    // @ts-ignore
    return matchRoutes<RouteType>(routes, pathname, this.basename);
  }

  isSkippedAuthCheckRoute(pathname: string) {
    const matchedRoutes = this.matchRoutes(pathname);
    return matchedRoutes.some((match) => {
      return match?.route?.skipAuthCheck === true;
    });
  }
  /**
   * @internal
   */
  getRouterComponent(children?: React.ReactNode) {
    const { type = 'browser', ...opts } = this.options;

    const routerCreators = {
      hash: createHashRouter,
      browser: createBrowserRouter,
      memory: createMemoryRouter,
    };

    const routes = this.getRoutesTree();

    const BaseLayoutContext = createContext<ComponentType>(null);

    const Provider = () => {
      const BaseLayout = useContext(BaseLayoutContext);
      return (
        <CustomRouterContextProvider>
          <BaseLayout>
            <VariablesProvider>
              <Outlet />
              {children}
            </VariablesProvider>
          </BaseLayout>
        </CustomRouterContextProvider>
      );
    };

    // bubble up error to application error boundary
    const ErrorElement = () => {
      const error = useRouteError();
      throw error;
    };

    this.router = routerCreators[type](
      [
        {
          element: <Provider />,
          errorElement: <ErrorElement />,
          children: routes,
        },
      ],
      opts,
    );

    const RenderRouter: React.FC<{ BaseLayout?: ComponentType }> = ({ BaseLayout = BlankComponent }) => {
      return (
        <BaseLayoutContext.Provider value={BaseLayout}>
          <RouterContextCleaner>
            <RouterProvider router={this.router} />
          </RouterContextCleaner>
        </BaseLayoutContext.Provider>
      );
    };

    return RenderRouter;
  }

  add(name: string, route: RouteType) {
    this.routes[name] = route;
  }

  get(name: string) {
    return this.routes[name];
  }

  has(name: string) {
    return !!this.get(name);
  }

  remove(name: string) {
    delete this.routes[name];
  }
}

export function createRouterManager(options?: RouterOptions, app?: Application) {
  return new RouterManager(options, app);
}
