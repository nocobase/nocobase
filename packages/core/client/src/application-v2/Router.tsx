import set from 'lodash/set';
import React, { ComponentType } from 'react';
import { BrowserRouter, HashRouter, MemoryRouter, RouteObject, useRoutes } from 'react-router-dom';
import { Application } from './Application';
import { BlankComponent } from './components/BlankComponent';
import { RouterContextCleaner } from './components/RouterContextCleaner';
import { RouterOptions, RouteType } from './types';

export class Router {
  protected routes: Record<string, RouteType> = {};

  constructor(protected options: RouterOptions, protected app: Application) { }

  getRoutes(): RouteObject[] {
    type RouteTypeWithChildren = RouteType & { children?: RouteTypeWithChildren };
    const routes: Record<string, RouteTypeWithChildren> = {};

    /**
     * { 'a': { name: '1' }, 'a.b': { name: '2' }, 'a.c': { name: '3' } };
     * =>
     * { a: { name: '1', children: { b: { name: '2' }, c: {name: '3'} } } }
     */
    for (const [name, route] of Object.entries(this.routes)) {
      set(routes, name.split('.').join('.children.'), route);
    }

    /**
     * get RouteObject tree
     *
     * @example
     * { a: { name: '1', children: { b: { name: '2' }, c: {name: '3'} } } }
     * =>
     * { name: '1', children: [{ name: '2' }, { name: '3' }] }
     */
    const buildRoutesTree = (routes: RouteTypeWithChildren): RouteObject[] => {
      return Object.values(routes).map<RouteObject>((item: RouteTypeWithChildren) => {
        const { Component, children, ...reset } = item;
        return {
          ...reset,
          element: Component ? this.app.renderComponent(Component) : item.element,
          children: children ? buildRoutesTree(children) : undefined,
        } as RouteObject;
      });
    };

    return buildRoutesTree(routes);
  }

  createRouter() {
    const { type, ...opts } = this.options;
    const Routers = {
      hash: HashRouter,
      browser: BrowserRouter,
      memory: MemoryRouter,
    };

    const ReactRouter = Routers[type] || BrowserRouter;

    const RenderRoutes = () => {
      const element = useRoutes(this.getRoutes());
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

  remove(name: string) {
    delete this.routes[name];
  }
}
