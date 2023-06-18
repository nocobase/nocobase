import set from 'lodash/set';
import React from 'react';
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom';
import { Application } from './Application';
import { InternalRouter } from './components/InternalRouter';
import { RouterOptions } from './types';

const defaultRouterTypes = new Map();

defaultRouterTypes.set('hash', HashRouter);
defaultRouterTypes.set('browser', BrowserRouter);
defaultRouterTypes.set('memory', MemoryRouter);

export class Router {
  protected app: Application;
  protected routes: Map<string, any>;
  protected routerTypes: Map<string, any>;

  constructor(protected options?: RouterOptions, protected context?: any) {
    this.routes = new Map<string, any>();
    this.app = context.app;
    this.routerTypes = defaultRouterTypes;
  }

  getRoutes() {
    const routes = {};
    for (const [name, route] of this.routes) {
      set(routes, name.split('.').join('.children.'), route);
    }

    const transform = (item) => {
      if (item.component) {
        item.Component = this.app.getComponent(item.component);
      }
      return item;
    };

    const toArr = (items: any) => {
      return Object.values<any>(items || {}).map((item) => {
        if (item.children) {
          item.children = toArr(item.children);
        }
        return transform(item);
      });
    };
    return toArr(routes);
  }

  render(props?: any) {
    const routes = this.getRoutes();
    return React.createElement(InternalRouter, {
      Router: this.routerTypes.get(this.options.type),
      routes,
      ...this.options,
      ...props,
    });
  }

  add(name: string, route: any) {
    this.routes.set(name, route);
    Object.keys(route.children || {}).forEach((key) => {
      this.routes.set(`${name}.${key}`, route.children[key]);
    });
  }

  remove(name: string) {
    this.routes.delete(name);
  }
}
