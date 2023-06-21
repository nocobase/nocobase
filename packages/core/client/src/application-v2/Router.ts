import set from 'lodash/set';
import { createBrowserRouter, createHashRouter, createMemoryRouter } from 'react-router-dom';
import { Application } from './Application';
import { RouterOptions } from './types';

export class Router {
  protected app: Application;
  protected routes: Map<string, any>;

  constructor(protected options?: RouterOptions, protected context?: any) {
    this.routes = new Map<string, any>();
    this.app = context.app;
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

  createRouter() {
    const { type, ...opts } = this.options;
    const routes = this.getRoutes();
    if (routes.length === 0) {
      return null;
    }
    switch (type) {
      case 'hash':
        return createHashRouter(routes, opts) as any;
      case 'browser':
        return createBrowserRouter(routes, opts) as any;
      case 'memory':
        return createMemoryRouter(routes, opts) as any;
      default:
        return createMemoryRouter(routes, opts) as any;
    }
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
