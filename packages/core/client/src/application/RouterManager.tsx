import { get, set } from 'lodash';
import React, { ComponentType } from 'react';
import {
  BrowserRouter,
  BrowserRouterProps,
  HashRouter,
  HashRouterProps,
  MemoryRouter,
  MemoryRouterProps,
  RouteObject,
  useRoutes,
} from 'react-router-dom';
import { Application } from './Application';
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
};
export type ComponentTypeAndString<T = any> = ComponentType<T> | string;
export interface RouteType extends Omit<RouteObject, 'children' | 'Component'> {
  Component?: ComponentTypeAndString;
}
export type RenderComponentType = (Component: ComponentTypeAndString, props?: any) => React.ReactNode;

export class RouterManager {
  protected routes: Record<string, RouteType> = {};
  protected options: RouterOptions;
  public app: Application;

  constructor(options: RouterOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
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

  /**
   * @internal
   */
  getRouterComponent() {
    const { type = 'browser', ...opts } = this.options;
    const Routers = {
      hash: HashRouter,
      browser: BrowserRouter,
      memory: MemoryRouter,
    };

    const ReactRouter = Routers[type];

    const RenderRoutes = () => {
      const routes = this.getRoutesTree();
      const element = useRoutes(routes);
      return element;
    };

    const RenderRouter: React.FC<{ BaseLayout?: ComponentType }> = ({ BaseLayout = BlankComponent }) => {
      return (
        <RouterContextCleaner>
          <ReactRouter {...opts}>
            <BaseLayout>
              <RenderRoutes />
            </BaseLayout>
          </ReactRouter>
        </RouterContextCleaner>
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
