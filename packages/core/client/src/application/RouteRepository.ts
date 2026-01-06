/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type RouteOptions = {
  id: string;
  schemaUid: string;
  children?: RouteOptions[];
};

export class RouteRepository {
  routes: Array<RouteOptions> = [];

  constructor(protected ctx) {}

  setRoutes(routes: Array<any>) {
    this.routes = routes;
  }

  listAccessible() {
    return this.routes;
  }

  getRouteBySchemaUid(schemaUid: string): RouteOptions | undefined {
    return this.findRoute(this.routes, schemaUid);
  }

  private findRoute(routes: RouteOptions[], schemaUid: string): RouteOptions | undefined {
    for (const route of routes) {
      if (route.schemaUid === schemaUid) {
        return route;
      }
      if (route.children) {
        const found = this.findRoute(route.children, schemaUid);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }
}
